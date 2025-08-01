"""
Documentation service for managing documentation data
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from openai import OpenAI
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.models.artifact_update import ArtifactUpdate
from pogoapi.models.documentation import Documentation
from pogoapi.models.error_message import ErrorMessage
from pogoapi.services.llm_processor import LLMProcessor
from pogoapi.services.artifact_service import ArtifactService
from pogoapi.utils.image_utils import ImageProcessor
from pogoapi.utils.langchain_components import VectorStoreManager
from functools import lru_cache
import hashlib

# Configure logger
logger = logging.getLogger(__name__)

class DocumentationService:
    """
    Service for managing documentation data with improved error handling and caching
    """
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(DocumentationService, cls).__new__(cls)
        return cls._instance

    def __init__(self, openai_client: Optional[OpenAI] = None, db_client: Optional[Any] = None):
        if not self._initialized:
            self._initialize_services(openai_client, db_client)
            self._initialized = True

    def _initialize_services(self, openai_client: Optional[OpenAI] = None, db_client: Optional[Any] = None):
        """Initialize required services with proper error handling"""
        try:
            # Initialize MongoDB client
            self.mongodb = db_client or get_mongodb_client()
            
            # Get OpenAI client
            if not openai_client:
                api_key = os.getenv("OPENAI_API_KEY")
                if not api_key:
                    raise ValueError("OPENAI_API_KEY environment variable is not set")
                openai_client = OpenAI(api_key=api_key)
            
            # Initialize other services
            self.llm_processor = LLMProcessor()
            self.artifact_service = ArtifactService()
            self.image_processor = ImageProcessor()
            self.vector_store = VectorStoreManager(openai_client=openai_client, db_client=self.mongodb)
            
            logger.info("DocumentationService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize DocumentationService: {str(e)}")
            raise

    def _generate_cache_key(self, data: Dict[str, Any]) -> str:
        """Generate a cache key for documentation data"""
        try:
            # Create a stable string representation of the data
            data_str = json.dumps(data, sort_keys=True)
            # Generate a hash of the data
            return hashlib.md5(data_str.encode()).hexdigest()
        except Exception as e:
            logger.error(f"Error generating cache key: {str(e)}")
            return str(datetime.utcnow().timestamp())

    @lru_cache(maxsize=1000)  # Increased cache size for production
    def get_documentation(self, query: Dict[str, Any], collection: str) -> Optional[Dict[str, Any]]:
        """Get documentation with caching"""
        try:
            return self.mongodb.get_documentation(query, collection)
        except Exception as e:
            logger.error(f"Error getting documentation: {str(e)}")
            return None

    def _store_documentation(self, data: Dict[str, Any], collection: str) -> bool:
        """Store documentation with proper error handling"""
        try:
            # Generate cache key
            cache_key = self._generate_cache_key(data)
            
            # Store in MongoDB
            result = self.mongodb.insert_documentation(data, collection)
            if not result:
                logger.error("Failed to store documentation in MongoDB")
                return False
                
            # Invalidate cache
            self.get_documentation.cache_clear()
            
            return True
        except Exception as e:
            logger.error(f"Error storing documentation: {str(e)}")
            return False

    def _store_error(self, error_data: Dict[str, Any], collection: str) -> bool:
        """Store error message with proper error handling"""
        try:
            return self.mongodb.insert_documentation(error_data, collection)
        except Exception as e:
            logger.error(f"Error storing error message: {str(e)}")
            return False

    def update_documentation(self, query: Dict[str, Any], update: Dict[str, Any], collection: str) -> bool:
        """Update documentation with proper error handling and cache invalidation"""
        try:
            # Update in MongoDB
            result = self.mongodb.update_documentation(query, update, collection)
            if not result:
                logger.warning("No documents were modified during update")
                return False
                
            # Invalidate cache only on successful update
            self.get_documentation.cache_clear()
            
            return True
        except Exception as e:
            logger.error(f"Error updating documentation: {str(e)}")
            return False

    def process_artifact(self, artifact_id: str, session_id: str, file_path: str, 
                        file_type: str, content: str) -> Tuple[bool, Optional[str]]:
        """Process artifact with improved error handling"""
        try:
            # Get artifact data
            artifact_data = self.mongodb.get_documentation(
                {"artifact_id": artifact_id},
                "artifacts"
            )
            if not artifact_data:
                logger.error(f"Artifact not found: {artifact_id}")
                return False, "Artifact not found"

            # Process based on file type
            if file_type == "image":
                return self._process_image(artifact_id, session_id, file_path, content)
            elif file_type == "audio":
                return self._process_audio(artifact_id, session_id, file_path, content)
            else:
                return self._process_text(artifact_id, session_id, file_path, content)

        except Exception as e:
            error_msg = f"Error processing artifact: {str(e)}"
            logger.error(error_msg)
            self._store_error({
                "artifact_id": artifact_id,
                "session_id": session_id,
                "error": error_msg,
                "timestamp": datetime.utcnow()
            }, "error_messages")
            return False, error_msg

    def _process_image(self, artifact_id: str, session_id: str, file_path: str, 
                      content: str) -> Tuple[bool, Optional[str]]:
        """Process image with proper error handling"""
        try:
            # Get image analysis
            analysis = self.mongodb.get_documentation(
                {"artifact_id": artifact_id},
                "image_analysis"
            )
            if not analysis:
                logger.warning(f"No image analysis found for artifact: {artifact_id}")
                return False, "No image analysis found"

            # Store documentation
            if not self._store_documentation({
                "artifact_id": artifact_id,
                "session_id": session_id,
                "content": analysis["content"],
                "file_path": file_path,
                "timestamp": datetime.utcnow()
            }, "documentation"):
                return False, "Failed to store documentation"

            return True, None

        except Exception as e:
            error_msg = f"1 Error processing image: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

    def _process_audio(self, artifact_id: str, session_id: str, file_path: str, 
                      content: str) -> Tuple[bool, Optional[str]]:
        """Process audio with proper error handling"""
        try:
            # Get audio context
            context = self.mongodb.get_documentation(
                {"artifact_id": artifact_id},
                "audio_context"
            )
            if not context:
                logger.warning(f"No audio context found for artifact: {artifact_id}")
                return False, "No audio context found"

            # Store documentation
            if not self._store_documentation({
                "artifact_id": artifact_id,
                "session_id": session_id,
                "content": context["content"],
                "file_path": file_path,
                "timestamp": datetime.utcnow()
            }, "documentation"):
                return False, "Failed to store documentation"

            return True, None

        except Exception as e:
            error_msg = f"Error processing audio: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

    def _process_text(self, artifact_id: str, session_id: str, file_path: str, 
                     content: str) -> Tuple[bool, Optional[str]]:
        """Process text with proper error handling"""
        try:
            # Store documentation
            if not self._store_documentation({
                "artifact_id": artifact_id,
                "session_id": session_id,
                "content": content,
                "file_path": file_path,
                "timestamp": datetime.utcnow()
            }, "documentation"):
                return False, "Failed to store documentation"

            return True, None

        except Exception as e:
            error_msg = f"Error processing text: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

    def get_artifact_documentation(self, artifact_id: str) -> Optional[Dict[str, Any]]:
        """Get artifact documentation with proper error handling"""
        try:
            return self.mongodb.get_documentation(
                {"artifact_id": artifact_id},
                "documentation"
            )
        except Exception as e:
            logger.error(f"Error getting artifact documentation: {str(e)}")
            return None

    def get_session_documentation(self, session_id: str) -> List[Dict[str, Any]]:
        """Get session documentation with proper error handling"""
        try:
            return list(self.mongodb.db.documentation.find({"session_id": session_id}))
        except Exception as e:
            logger.error(f"Error getting session documentation: {str(e)}")
            return []

    def get_error_messages(self, artifact_id: str) -> List[Dict[str, Any]]:
        """Get error messages with proper error handling"""
        try:
            return list(self.mongodb.db.error_messages.find({"artifact_id": artifact_id}))
        except Exception as e:
            logger.error(f"Error getting error messages: {str(e)}")
            return []

    def get_documentation_by_id(self, documentation_id: str) -> Optional[Dict[str, Any]]:
        """Get documentation by its ID"""
        try:
            from bson import ObjectId
            if not ObjectId.is_valid(documentation_id):
                logger.error(f"Invalid documentation ID format: {documentation_id}")
                return None
            
            return self.mongodb.db.documentation.find_one({"_id": ObjectId(documentation_id)})
        except Exception as e:
            logger.error(f"Error getting documentation by ID: {str(e)}")
            return None

    def generate_documentation(self, session_id: str) -> Dict[str, Any]:
        """Generate documentation for a session"""
        try:
            # Get all artifacts for the session
            artifacts = list(self.mongodb.db.artifacts.find({"session_id": session_id}))
            if not artifacts:
                return {"error": "No artifacts found for session"}

            # Generate documentation content
            content = f"Documentation for session {session_id}\n\n"
            for artifact in artifacts:
                content += f"Artifact: {artifact.get('name', 'Unknown')}\n"
                content += f"Type: {artifact.get('type', 'Unknown')}\n"
                content += f"Content: {artifact.get('content', 'No content')}\n\n"

            # Store the generated documentation
            doc_data = {
                "session_id": session_id,
                "content": content,
                "generated_at": datetime.utcnow(),
                "status": "completed"
            }
            
            result = self.mongodb.db.documentation.insert_one(doc_data)
            doc_data["_id"] = result.inserted_id
            
            return doc_data
        except Exception as e:
            logger.error(f"Error generating documentation: {str(e)}")
            return {"error": str(e)}

    def update_documentation(self, documentation_id: str, content: str) -> Optional[Dict[str, Any]]:
        """Update documentation content"""
        try:
            from bson import ObjectId
            if not ObjectId.is_valid(documentation_id):
                logger.error(f"Invalid documentation ID format: {documentation_id}")
                return None
            
            update_data = {
                "content": content,
                "updated_at": datetime.utcnow()
            }
            
            result = self.mongodb.db.documentation.update_one(
                {"_id": ObjectId(documentation_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                # Return the updated document
                return self.mongodb.db.documentation.find_one({"_id": ObjectId(documentation_id)})
            else:
                logger.warning(f"No documentation found with ID: {documentation_id}")
                return None
        except Exception as e:
            logger.error(f"Error updating documentation: {str(e)}")
            return None

    def update_status(self, documentation_id: str, status: str) -> Optional[Dict[str, Any]]:
        """Update documentation status"""
        try:
            from bson import ObjectId
            if not ObjectId.is_valid(documentation_id):
                logger.error(f"Invalid documentation ID format: {documentation_id}")
                return None
            
            update_data = {
                "status": status,
                "updated_at": datetime.utcnow()
            }
            
            result = self.mongodb.db.documentation.update_one(
                {"_id": ObjectId(documentation_id)},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                # Return the updated document
                return self.mongodb.db.documentation.find_one({"_id": ObjectId(documentation_id)})
            else:
                logger.warning(f"No documentation found with ID: {documentation_id}")
                return None
        except Exception as e:
            logger.error(f"Error updating documentation status: {str(e)}")
            return None 