"""
LangChain-based processor for handling LLM operations.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from openai import OpenAI
from pogoapi.utils.prompt_loader import PromptLoader
from pogoapi.utils.mongodb_client import MongoDBClient
import uuid
from pogoapi.utils.langchain_components import VectorStoreManager
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from pogoapi.utils.path_utils import PathBuilder
from pogoapi.utils.document_exporter import DocumentExporter
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from pogoapi.utils.langchain_components import (
    ImageAnalysisChain,
    MemoryManager
)

# Configure logger
logger = logging.getLogger(__name__)

class LLMProcessorUtils:
    """
    Handles LLM operations using configured providers and Langchain components
    """
    
    def __init__(self, api_key: str, db_client: MongoDBClient):
        """
        Initialize with API key and MongoDB client
        
        Args:
            api_key: API key for the LLM provider
            db_client: MongoDB client instance
        """
        self.db_client = db_client
        self.prompt_loader = PromptLoader()
        self.path_builder = PathBuilder(db_client)
        
        # Initialize OpenAI client for audio transcription
        self.openai_client = OpenAI(
            api_key=api_key
        )
        
        # Initialize Langchain components
        self.llm = ChatOpenAI(
            openai_api_key=api_key,
            model_name="gpt-4o"
        )
        self.image_analysis_chain = ImageAnalysisChain(self.llm, db_client)
        self.vector_store = VectorStoreManager(
            openai_client=self.openai_client,
            db_client=db_client
        )
        self.memory_manager = MemoryManager(db_client)
        
    def _is_artifact_processed(self, artifact_id: str) -> bool:
        """
        Check if an artifact has already been processed and stored in the database
        
        Args:
            artifact_id: The ID of the artifact to check
            
        Returns:
            bool: True if the artifact has been processed, False otherwise
        """
        try:
            # Convert artifact_id to ObjectId
            artifact_oid = ObjectId(artifact_id)
            
            # Get the latest successful update for this artifact
            latest_update = self.db_client.db["artifact_updates"].find_one(
                {
                    "artifactId": artifact_oid,
                    "status": "processed"  # Only consider successful updates
                },
                sort=[("createdAt", -1)]
            )
            
            return latest_update is not None
            
        except Exception as e:
            logger.error(f"Error checking artifact processing status: {str(e)}")
            return False

    def _get_artifact_id_from_path(self, file_path: str) -> Optional[str]:
        """
        Get the artifact ID for a file by looking up its path in the database
        
        Args:
            file_path: Path to the file
            
        Returns:
            Optional[str]: Artifact ID if found, None otherwise
        """
        try:
            # Get the relative path
            relative_path = self.path_builder.get_relative_path(file_path)
            
            # Look up the artifact in the database
            artifact = self.db_client.db["artifacts"].find_one({"url": relative_path})
            if artifact:
                return str(artifact["_id"])
            return None
            
        except Exception as e:
            logger.error(f"Error getting artifact ID from path: {str(e)}")
            return None

    def process_audio(self, audio_path: str, artifact_id: str) -> Optional[str]:
        """
        Process audio file by transcribing it using OpenAI's Whisper API
        
        Args:
            audio_path: Path to the audio file
            artifact_id: ID of the artifact being processed
            
        Returns:
            Transcribed text or None if processing failed
        """
        try:
            # Check if file exists
            if not os.path.exists(audio_path):
                logger.error(f"Audio file not found: {audio_path}")
                return None
                
            # Check file size
            file_size = os.path.getsize(audio_path)
            if file_size == 0:
                logger.error(f"Audio file is empty: {audio_path}")
                return None
            try:    
                # Transcribe audio using OpenAI's Whisper API
                with open(audio_path, "rb") as audio_file:
                    transcript = self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file
                    )
            except Exception as e:
                logger.exception(f"Failed to transcribe audio: {e}")
                return None
            
            return transcript.text
            
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            return None
            
    def process_image(self, image_path: str, artifact_id: str, audio_context: str = "") -> Optional[str]:
        """
        Process an image file and store the analysis in the database.
        
        Args:
            image_path: Path to the image file
            artifact_id: ID of the artifact
            audio_context: Optional audio transcript to provide context
            
        Returns:
            Optional[str]: Analysis result or None if processing failed
        """
        try:
            # Check if artifact is already processed
            if self._is_artifact_processed(artifact_id):
                print(f"Skipping image artifact {artifact_id} - already processed in artifact_updates collection")
                return None
                
            # Get artifact details from database
            artifact = self.db_client.get_documentation(
                {"_id": ObjectId(artifact_id)},
                "artifacts"
            )
            if not artifact:
                logger.error(f"Artifact not found: {artifact_id}")
                return None
                
            # Analyze image with chain
            logger.info("Starting image analysis with chain")
            analysis = self.image_analysis_chain.analyze(image_path, audio_context)
            
            if not analysis:
                error_msg = "Failed to analyze image"
                logger.error(error_msg)
                self.db_client.store_artifact_update(
                    artifact_id,
                    "failed",
                    error_message=error_msg
                )
                return None
                
            # Store successful update in MongoDB
            success = self.db_client.store_artifact_update(
                artifact_id,
                "processed",
                processed_text=analysis
            )
            
            if not success:
                logger.error(f"Failed to store artifact update for {artifact_id}")
                return None
            
            logger.info(f"Successfully processed image artifact {artifact_id}")
            return analysis
                
        except Exception as e:
            error_msg = f"4 Error processing image: {str(e)}"
            logger.error(error_msg)
            self.db_client.store_artifact_update(
                artifact_id,
                "failed",
                error_message=error_msg
            )
            return None
            
    def _store_failed_update(self, file_path: str, update_type: str, reason: str) -> None:
        """
        Store a failed update in the artifact_updates collection
        
        Args:
            file_path: Path to the file that failed processing
            update_type: Type of update (transcription or image_analysis)
            reason: Reason for failure
        """
        try:
            # Get the artifact ID and session ID from the file path
            path_parts = os.path.normpath(file_path).split(os.sep)
            artifact_id = path_parts[-2]  # Directory containing the file
            session_id = path_parts[-3]  # Parent directory is the session ID
            
            # Create update document
            update_doc = {
                "artifactId": artifact_id,
                "sessionId": session_id,
                "update_type": update_type,
                "status": "failed",
                "reason": reason,
                "createdAt": datetime.now()
            }
            
            # Insert into artifact_updates collection
            self.db_client.db["artifact_updates"].insert_one(update_doc)
            print(f"Stored failed {update_type} for artifact {artifact_id} in session {session_id}")
            
        except Exception as e:
            print(f"Error storing failed update: {e}")
            
    def get_session_updates(self, session_id: str) -> List[Dict]:
        """
        Get all updates for a session, grouped by artifact ID
        
        Args:
            session_id: The session ID to get updates for
            
        Returns:
            List[Dict]: List of update documents
        """
        try:
            pipeline = [
                {
                    "$match": {
                        "sessionId": session_id,
                        "status": "processed",
                        "update_type": "image_analysis"
                    }
                },
                {"$sort": {"createdAt": -1}},
                {
                    "$group": {
                        "_id": "$artifactId",
                        "update": {"$first": "$$ROOT"}
                    }
                },
                {"$replaceRoot": {"newRoot": "$update"}}
            ]
            
            updates = list(self.db_client.db["artifact_updates"].aggregate(pipeline))
            return updates
            
        except Exception as e:
            print(f"Error getting session updates: {e}")
            return []
            
    def process_session(self, session_id: str) -> Optional[str]:
        """
        Process a session by:
        1. Processing all audio first
        2. Processing each image with its relevant audio context
        3. Combining the analyses into a final document
        
        Args:
            session_id: The session ID to process
            
        Returns:
            Optional[str]: Combined analysis text or None if processing failed
        """
        try:
            # Get all processed updates for the session
            updates = self.get_session_updates(session_id)
            
            if not updates:
                print(f"No processed updates found for session {session_id}")
                return None
                
            # Group updates by type and sort by timestamp
            updates_by_type = {}
            for update in updates:
                update_type = update["update_type"]
                if update_type not in updates_by_type:
                    updates_by_type[update_type] = []
                updates_by_type[update_type].append(update)
            
            # Sort all updates by timestamp
            for updates in updates_by_type.values():
                updates.sort(key=lambda x: x["createdAt"])
            
            # Process each image with its relevant audio context
            processed_analyses = []
            
            if "image_analysis" in updates_by_type:
                image_analyses = updates_by_type["image_analysis"]
                
                for analysis in image_analyses:
                    # Find relevant audio context
                    relevant_audio = []
                    if "transcription" in updates_by_type:
                        # Get transcriptions within a reasonable time window (e.g., 5 minutes)
                        time_window = datetime.timedelta(minutes=5)
                        relevant_audio = [
                            trans for trans in updates_by_type["transcription"]
                            if abs((trans["createdAt"] - analysis["createdAt"]).total_seconds()) <= time_window.total_seconds()
                        ]
                    
                    # Format the image analysis with its context
                    formatted_content = (
                        f"### Visual Analysis (Artifact: {analysis['artifactId']})\n"
                        f"Timestamp: {analysis['createdAt'].strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                        f"#### Visual Description\n{analysis['content']}\n"
                    )
                    
                    if relevant_audio:
                        formatted_content += "\n#### Related Audio Context\n"
                        for audio in relevant_audio:
                            formatted_content += (
                                f"From Audio (Artifact: {audio['artifactId']}):\n"
                                f"Recorded at: {audio['createdAt'].strftime('%Y-%m-%d %H:%M:%S')}\n"
                                f"```\n{audio['content']}\n```\n"
                            )
                    
                    # Process this image-audio pair
                    output = self._process_image_audio_pair(formatted_content)
                    if output:
                        processed_analyses.append(output)
            
            # Combine all analyses into final document
            if processed_analyses:
                final_output = "\n\n---\n\n".join(processed_analyses)
                
                # Store the final output in session_updates collection
                try:
                    # Get all artifact IDs from the updates
                    artifact_ids = [update["artifactId"] for update in updates]
                    
                    # Create session update document
                    session_update_doc = {
                        "artifactIds": artifact_ids,
                        "sessionId": session_id,
                        "update_type": "combined_analysis",
                        "content": final_output,
                        "status": "processed",
                        "createdAt": datetime.datetime.now()
                    }
                    
                    # Insert into session_updates collection
                    self.db_client.db["session_updates"].insert_one(session_update_doc)
                    print(f"Stored combined analysis for session {session_id}")
                    
                except Exception as e:
                    print(f"Error storing combined analysis: {e}")
                    return None
                
                print(f"Successfully processed session {session_id}")
                return final_output
            else:
                print("No valid analyses generated")
                return None
            
        except Exception as e:
            print(f"Error processing session {session_id}: {e}")
            return None
            
    def _process_image_audio_pair(self, content: str) -> Optional[str]:
        """
        Process a single image with its relevant audio context
        
        Args:
            content: The formatted content to process
            
        Returns:
            Optional[str]: Processed output or None if processing failed
        """
        try:
            # Create the processing chain
            process_chain = RunnableSequence(
                ChatPromptTemplate.from_messages([
                    ("system", "You are a helpful assistant."),
                    ("user", (
                        "Please analyze this image and its related audio context. "
                        "Your analysis should:\n\n"
                        "1. First describe the visual content in detail\n"
                        "2. Then analyze how the audio context relates to the visual content:\n"
                        "   - Which parts of the audio directly reference or explain the visual elements?\n"
                        "   - How does the audio provide additional context or clarification?\n"
                        "   - Are there any discrepancies between what's shown and what's described?\n"
                        "   - What important information is mentioned in audio but not visible?\n"
                        "3. Finally, provide a synthesis of how the audio enhances understanding of the visual content\n\n"
                        "{content}"
                    ))
                ]) | self.llm
            )
            
            result = process_chain.invoke({"content": content})
            return result.content
            
        except Exception as e:
            print(f"5 Error processing image-audio pair: {e}")
            return None
            
    def _process_chunk(self, chunk: List[Dict]) -> Optional[str]:
        """
        Process a chunk of updates
        
        Args:
            chunk: List of update documents to process
            
        Returns:
            Optional[str]: Processed chunk text or None if processing failed
        """
        try:
            # Format chunk content
            chunk_text = ""
            for update in chunk:
                update_type = update.get("update_type", "")
                content = update.get("content", "")
                
                if update_type == "transcription":
                    chunk_text += f"Audio Transcription:\n{content}\n\n"
                elif update_type == "image_analysis":
                    chunk_text += f"Image Analysis:\n{content}\n\n"
                    
            # Get system prompt
            system_prompt = self.prompt_loader.get_prompt("unified_output")
            
            # Process chunk using provider
            processed_chunk = self.llm_provider.process_text(chunk_text, system_prompt)
            if not processed_chunk:
                print("Failed to process chunk")
                return None
                
            return processed_chunk
            
        except Exception as e:
            print(f"Error processing chunk: {e}")
            return None
            
    def _combine_chunks(self, processed_chunks: List[str]) -> Optional[str]:
        """
        Combine processed chunks into a final document
        
        Args:
            processed_chunks: List of processed chunk texts
            
        Returns:
            Optional[str]: Combined document text or None if combination failed
        """
        try:
            # Get system prompt
            system_prompt = self.prompt_loader.get_prompt("unified_output")
            
            # Combine all chunks
            combined_text = "\n\n---\n\n".join(processed_chunks)
            
            # Process combined text using provider
            final_document = self.llm_provider.process_text(combined_text, system_prompt)
            if not final_document:
                print("Failed to combine chunks")
                return None
                
            return final_document
            
        except Exception as e:
            print(f"Error combining chunks: {e}")
            return None
            
    def generate_unified_output(self, session_id: str) -> str:
        """
        Generate a unified output document from all processed artifacts in a session.
        Processes content in chunks to handle large amounts of data.
        
        Args:
            session_id: The session ID to process
            
        Returns:
            str: The final unified document
        """
        try:
            # Get all processed updates for the session
            updates = self.db_client.get_session_updates(session_id)
            if not updates:
                print(f"No processed updates found for session {session_id}")
                return None
                
            # Sort updates by creation time
            updates.sort(key=lambda x: x.get("createdAt", datetime.datetime.min))
            
            # Process updates in chunks
            processed_chunks = []
            chunk_size = 3  # Process 3 images at a time
            
            for i in range(0, len(updates), chunk_size):
                chunk = updates[i:i + chunk_size]
                processed_chunk = self._process_chunk(chunk)
                if processed_chunk:
                    processed_chunks.append(processed_chunk)
            
            # Combine all processed chunks
            final_document = self._combine_chunks(processed_chunks)
            
            # Export to Word document
            exporter = DocumentExporter(self.db_client, self.path_builder)
            doc_path = exporter.export_session_document(session_id)
            
            if doc_path:
                print(f"Successfully exported documentation to: {doc_path}")
            else:
                print("Failed to export documentation")
            
            return final_document
            
        except Exception as e:
            print(f"Error generating unified output: {e}")
            return None
            
    def generate_document(self, session_id: str, analyses: List[Dict]) -> Optional[str]:
        """
        Generate a document from the session analyses using Langchain document chain
        
        Args:
            session_id: ID of the session
            analyses: List of analysis dictionaries
            
        Returns:
            Optional[str]: Generated document content or None if generation failed
        """
        try:
            # Get conversation memory for context
            memory = self.memory_manager.get_memory(session_id)
            
            # Format analyses for document generation
            formatted_analyses = []
            for analysis in analyses:
                formatted_analyses.append({
                    "image_path": analysis.get("image_path", ""),
                    "analysis": analysis.get("analysis", ""),
                    "audio_context": analysis.get("audio_context", "")
                })
            
            # Generate document using Langchain chain
            result = self.document_chain.chain.run(
                session_id=session_id,
                analyses=formatted_analyses,
                memory=memory
            )
            
            if not result:
                print(f"Document generation failed for session {session_id}")
                return None
                
            # Store generated document in vector database
            self.vector_store.store_analysis(
                session_id=session_id,
                analysis=result,
                metadata={
                    "type": "generated_document",
                    "timestamp": datetime.datetime.now().isoformat()
                }
            )
            
            return result
            
        except Exception as e:
            print(f"Error generating document: {e}")
            return None

    def generate_response(self, message: str, context: str = "", project_id: str = "") -> str:
        """
        Generate a response to a user message using the LLM
        
        Args:
            message: The user's message
            context: Optional context from vector store
            project_id: Optional project ID for context
            
        Returns:
            str: The generated response
        """
        try:
            # Check if this is a greeting
            is_greeting = any(word in message.lower() for word in ["hello", "hi", "hey", "greetings"])
            
            if is_greeting:
                # Use a simple greeting format
                return "Hello! What can I do for you today?"

            # Check if this is a how-to question
            is_how_to = any(phrase in message.lower() for phrase in ["how to", "how do i", "how can i", "steps to", "way to"])
            
            # If no context provided, try to get relevant context from vector store
            if not context and project_id:
                try:
                    # First, get similar vectors from Qdrant
                    similar_docs = self.vector_store.find_similar_analyses(
                        query=message,
                        k=3,  # Get top 3 most similar documents
                        project_id=project_id
                    )
                    
                    if similar_docs:
                        # Get vector IDs from similar documents
                        vector_ids = [doc.metadata.get("vector_id") for doc in similar_docs if doc.metadata.get("vector_id")]
                        
                        # Fetch full context from MongoDB's artifact_vectors collection
                        if vector_ids:
                            vector_contexts = []
                            for vector_id in vector_ids:
                                vector_doc = self.db_client.db["artifact_vectors"].find_one(
                                    {"_id": vector_id},
                                    {"analysis": 1, "metadata": 1}
                                )
                                if vector_doc:
                                    # Format context with metadata
                                    metadata = vector_doc.get("metadata", {})
                                    vector_contexts.append(
                                        f"Context from {metadata.get('type', 'document')}:\n"
                                        f"{vector_doc.get('analysis', '')}\n"
                                        f"Additional info: {metadata.get('additional_info', '')}"
                                    )
                            
                            if vector_contexts:
                                context = "\n\n".join(vector_contexts)
                            
                except Exception as e:
                    logger.error(f"Error retrieving context from vector store: {str(e)}")
                    # Continue without context if vector store fails

            # Get the prompt template
            prompt_template = self.prompt_loader.get_prompt("chat_response")
            
            # Format the prompt with the actual values
            formatted_prompt = prompt_template.format(
                project_id=project_id,
                context=context,
                message=message,
                is_how_to=is_how_to  # Add flag for how-to questions
            )

            # Create the chain
            chain = self.llm

            # Generate the response
            response = chain.invoke(formatted_prompt)

            return response.content

        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I'm sorry, I encountered an error while generating a response. Please try again." 