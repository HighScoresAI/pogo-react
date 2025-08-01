"""
Langchain components for enhanced LLM processing.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from openai import OpenAI
from pogoapi.utils.mongodb_client import MongoDBClient
from pogoapi.utils.path_utils import PathBuilder
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from langchain_community.vectorstores import FAISS, Qdrant
from langchain.memory import ConversationBufferMemory
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, VectorParams, Distance, PointStruct
import base64
from PIL import Image
import io
from langchain_core.documents import Document
from langchain.schema import SystemMessage, HumanMessage
import warnings

# Suppress Qdrant deprecation warning
warnings.filterwarnings("ignore", category=DeprecationWarning, module="langchain_community.vectorstores.qdrant")

logger = logging.getLogger(__name__)

class ImageAnalysisChain:
    """Chain for analyzing images with audio context"""
    
    def __init__(self, openai_client: OpenAI, db_client: MongoDBClient):
        self.openai_client = openai_client
        self.path_builder = PathBuilder(db_client)
        self.llm = ChatOpenAI(
            model="gpt-4o",   #deprecated, use gpt-4o instead gpt-4-vision-preview
            temperature=0.7,
            max_tokens=300
        )
        
    def analyze(self, image_path: str, audio_context: str = "") -> str:
        """
        Analyze image with optional audio context
        
        Args:
            image_path: Path to the image file
            audio_context: Optional audio transcript to provide context
            
        Returns:
            str: Analysis result or error message
        """
        try:
            logger.info(f"Starting image analysis for: {image_path}")
            
            # Read and encode image
            with open(image_path, 'rb') as image_file:
                image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Create messages for LangChain
            messages = [
                SystemMessage(content="Analyze this screenshot. Focus on key UI elements and functionality. Be concise."),
                HumanMessage(content=f"Image: {image_data}\nContext: {audio_context}")
            ]
            
            # Call LangChain
            response = self.llm.invoke(messages)
            
            return response.content
            
        except Exception as e:
            error_msg = f"Error analyzing image {image_path}: {str(e)}"
            logger.error(error_msg)
            return error_msg

class VectorStoreManager:
    """Manager for vector store operations"""
    
    def __init__(self, openai_client: OpenAI, db_client: MongoDBClient):
        self.openai_client = openai_client
        self.db = db_client
        self.path_builder = PathBuilder(db_client)
        
        # Initialize vector store
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        
        try:
            self.embeddings = OpenAIEmbeddings(
                model="text-embedding-3-small",
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )
            
            # Initialize Qdrant client only if we have the required configuration
            if qdrant_url and qdrant_api_key:
                logger.info(f"Raw Qdrant URL: {repr(qdrant_url)}")
                
                # Initialize Qdrant client with API key
                self.qdrant_client = QdrantClient(
                    url=qdrant_url,
                    api_key=qdrant_api_key,
                    prefer_grpc=False
                )
            else:
                logger.warning("Qdrant configuration is incomplete. Using FAISS as fallback.")
                self.qdrant_client = None
            
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {str(e)}")
            self.qdrant_client = None
    
    def _get_collection_name(self, session_id: str) -> str:
        """Get collection name for a session"""
        return f"session_{session_id}"
    
    def _ensure_collection_exists(self, session_id: str) -> None:
        """Ensure collection exists for a session"""
        if not self.qdrant_client:
            return
            
        collection_name = self._get_collection_name(session_id)
        
        # Create collection if it doesn't exist
        if not self.qdrant_client.collection_exists(collection_name):
            # Get vector size from embeddings
            vector_size = len(self.embeddings.embed_documents(["dummy_text"])[0])
            
            # Create collection with vector configuration
            self.qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created Qdrant collection {collection_name}")
    
    def store_analysis(self, session_id: str, analysis: str, metadata: Dict[str, Any]) -> None:
        """Store an analysis in the vector store"""
        try:
            # Check if the artifact has been processed
            artifact_id = metadata.get("artifact_id")
            if not artifact_id:
                return
                
            # Check if artifact is already processed in artifact_updates
            latest_update = self.db.db["artifact_updates"].find_one(
                {
                    "artifactId": artifact_id,
                    "status": "processed"
                },
                sort=[("createdAt", -1)]
            )
            
            if latest_update:
                logger.info(f"Artifact {artifact_id} already has updates, skipping vector creation")
                return
            
            # Ensure collection exists for this session
            self._ensure_collection_exists(session_id)
            
            # Generate embeddings
            embeddings = self.embeddings.embed_documents([analysis])
            
            # Create point for Qdrant
            point = PointStruct(
                id=artifact_id,
                vector=embeddings[0],
                payload={
                    "page_content": analysis,
                    "artifact_id": artifact_id,
                    "session_id": session_id,
                    **metadata
                }
            )
            
            # Add to Qdrant
            self.qdrant_client.upsert(
                collection_name=self._get_collection_name(session_id),
                points=[point]
            )
            logger.info(f"Successfully stored analysis in vector store for session {session_id}")
                
        except Exception as e:
            logger.error(f"Failed to store analysis in vector store: {str(e)}")
            # Don't raise the exception - allow the calling code to continue
    
    def find_similar_analyses(self, query: str, k: int = 5, project_id: Optional[str] = None) -> list:
        """Find similar analyses based on a query"""
        try:
            if not self.qdrant_client:
                return []
            
            # Generate query embedding
            query_embedding = self.embeddings.embed_documents([query])[0]
            
            # Use a default collection for general searches or project-specific searches
            collection_name = "general_vectors" if not project_id else f"project_{project_id}"
            
            # Create filter if project_id is provided
            filter_condition = None
            if project_id:
                filter_condition = Filter(
                    must=[
                        FieldCondition(
                            key="project_id",
                            match=MatchValue(value=project_id)
                        )
                    ]
                )
            
            # Check if collection exists, if not return empty results
            if not self.qdrant_client.collection_exists(collection_name):
                logger.warning(f"Collection {collection_name} does not exist")
                return []
            
            # Search in Qdrant
            results = self.qdrant_client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                limit=k,
                query_filter=filter_condition
            )
            
            return [{
                "score": result.score,
                "content": result.payload["page_content"],
                "metadata": {k: v for k, v in result.payload.items() if k != "page_content"}
            } for result in results]
            
        except Exception as e:
            logger.error(f"Failed to search vector store: {str(e)}")
            return []
    
    def get_session_vectors(self, session_id: str) -> List[Dict]:
        """Get all vectors for a specific session"""
        try:
            if not self.qdrant_client:
                return []
            
            # Create filter for session_id
            filter_condition = Filter(
                must=[
                    FieldCondition(
                        key="session_id",
                        match=MatchValue(value=session_id)
                    )
                ]
            )
            
            # Search in Qdrant with empty query vector to get all documents
            results = self.qdrant_client.scroll(
                collection_name=self._get_collection_name(session_id),
                scroll_filter=filter_condition,
                limit=100  # Adjust based on expected number of documents
            )
            
            return [{
                "score": 1.0,  # Scroll doesn't return scores
                "content": result.payload["page_content"],
                "metadata": {k: v for k, v in result.payload.items() if k != "page_content"}
            } for result in results[0]]
            
        except Exception as e:
            logger.error(f"Failed to get vectors for session {session_id}: {str(e)}")
            return []
    
    def delete_vectors(self, artifact_id: str, session_id: str) -> bool:
        """Delete vectors for an artifact from both MongoDB and Qdrant"""
        try:
            # Delete from MongoDB first
            mongo_success = self.db.delete_artifact_vector(artifact_id, session_id)
            if not mongo_success:
                logger.error(f"Failed to delete vectors from MongoDB for artifact {artifact_id}")
                return False

            # Delete from Qdrant
            try:
                # Create filter using the correct Qdrant format
                filter_conditions = [
                    FieldCondition(
                        key="artifact_id",
                        match=MatchValue(value=artifact_id)
                    ),
                    FieldCondition(
                        key="session_id",
                        match=MatchValue(value=session_id)
                    )
                ]
                
                # Delete points matching the filter
                self.qdrant_client.delete(
                    collection_name=self._get_collection_name(session_id),
                    points_selector=Filter(
                        must=filter_conditions
                    )
                )
                logger.info(f"Successfully deleted vectors from Qdrant for artifact {artifact_id}")
                return True
            except Exception as e:
                logger.error(f"Failed to delete vectors from Qdrant: {str(e)}")
                return False
        except Exception as e:
            logger.error(f"Error in delete_vectors: {str(e)}")
            return False

    def create_vector_store(self, documents: List[Document]) -> None:
        """Create a new vector store from documents"""
        # This method is no longer needed as we're using Qdrant directly
        pass

    def add_documents(self, documents: List[Document]) -> None:
        """Add documents to existing vector store"""
        # This method is no longer needed as we're using Qdrant directly
        pass

    def similarity_search(self, query: str, k: int = 4) -> List[Document]:
        """Search for similar documents"""
        # This method is no longer needed as we're using Qdrant directly
        return []

    def save(self, path: str) -> None:
        """Save vector store to disk"""
        # This method is no longer needed as we're using Qdrant directly
        pass

    def load(self, path: str) -> None:
        """Load vector store from disk"""
        # This method is no longer needed as we're using Qdrant directly
        pass

class MemoryManager:
    """Manager for conversation memory"""
    
    def __init__(self, db_client: MongoDBClient):
        self.db_client = db_client
    
    def get_session_memory(self, session_id: str) -> ConversationBufferMemory:
        """Get or create memory for a session"""
        return ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        ) 