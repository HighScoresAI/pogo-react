import logging
import os
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from pogoapi.utils.mongodb_client import MongoDBClient
from pogoapi.utils.langchain_components import VectorStoreManager
from pogoapi.utils.prompt_loader import PromptLoader
from pogoapi.utils.path_utils import PathBuilder
import uuid
from bson import ObjectId
from openai import OpenAI
from pogoapi.utils.langchain_components import VectorStoreManager
from pogoapi.utils.prompt_loader import PromptLoader
from pogoapi.utils.path_utils import PathBuilder
import os
from pogoapi.config import config
from langchain_openai import OpenAIEmbeddings
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorizationService:
    def __init__(self, openai_client: OpenAI, db: MongoDBClient):
        """Initialize VectorizationService with OpenAI and MongoDB clients"""
        self.openai_client = openai_client
        self.db = db
        
        # Ensure storage directory exists
        storage_path = config.get('STORAGE_PATH', 'hellopogo')
        os.makedirs(storage_path, exist_ok=True)
        
        self.path_builder = PathBuilder(self.db, storage_path)
        self.prompt_loader = PromptLoader()
        
        # Load LLM configuration
        self.llm_config = config.get_llm_config()
        provider = config.get_llm_provider()
        model_config = self.llm_config["models"][provider]
        
        if "embeddings" not in model_config:
            raise ValueError(f"No embeddings model configured for provider {provider}")
            
        self.model = model_config["text_processing"]
        self.max_tokens = model_config["max_tokens"]
        self.temperature = model_config["temperature"]
        
        # Initialize embeddings
        self.embeddings = OpenAIEmbeddings(
            model=model_config["embeddings"],
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.vector_store = VectorStoreManager(openai_client=self.openai_client, db_client=self.db)
        logger.info("VectorizationService initialized with OpenAI and MongoDB clients")

    def create_vectors(
        self,
        content: str,
        artifact_id: str,
        session_id: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create vectors for content"""
        try:
            # Generate embeddings
            embeddings = self.embeddings.embed_documents([content])
            
            # Convert ObjectId-like session_id to UUID
            session_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, session_id))
            artifact_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, artifact_id))
            # Store in vector store
            self.vector_store.store_analysis(
                session_id=session_uuid,
                analysis=content,
                metadata={
                    "artifact_id": artifact_uuid,
                    **metadata
                }
            )
            
            return {
                "status": "success",
                "artifact_id": artifact_id,
                "session_id": session_id
            }
            
        except Exception as e:
            error_msg = f"Error creating vectors: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }

    def update_vectors(
        self,
        content: str,
        artifact_id: str,
        session_id: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update vectors for content"""
        try:
            # Delete existing vectors
            self.delete_vectors(artifact_id, session_id)
            
            # Create new vectors
            return self.create_vectors(content, artifact_id, session_id, metadata)
            
        except Exception as e:
            error_msg = f"Error updating vectors: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }

    def delete_vectors(self, artifact_id: str, session_id: str) -> None:
        """Delete vectors for an artifact"""
        try:
            self.vector_store.delete_vectors(artifact_id, session_id)
        except Exception as e:
            logger.error(f"Error deleting vectors: {str(e)}")
            raise 