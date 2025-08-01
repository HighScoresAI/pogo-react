"""
MongoDB client for storing documentation data
"""

from typing import Dict, Any, Optional, List, Literal
from pymongo import MongoClient, errors
from bson import ObjectId # Keep ObjectId import as you'll use it directly
from bson.errors import InvalidId # Import InvalidId for error handling
from datetime import datetime
from dotenv import load_dotenv
import os
import logging
import asyncio
import urllib.parse
import threading
from pogoapi.models.artifact_update import ArtifactUpdate
from pymongo.collection import Collection
from functools import lru_cache
from pogoapi.config import config
from pogoapi.utils.mongodb_schemas import get_collection_indexes
import time
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure logger
logger = logging.getLogger(__name__)

# Load environment variables
# Consider loading .env from a specific path if not in the current working directory
load_dotenv() # Assumes .env is in the directory where the script is run, or its parents

class MongoDBClient:
    """
    Thread-safe MongoDB client with proper connection management
    """
    _instance = None
    _lock = threading.Lock()
    _initialized = False

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(MongoDBClient, cls).__new__(cls)
            return cls._instance

    def __init__(self):
        with self._lock:
            if not self._initialized:
                self._initialize_config()
                self._initialized = True

    def _initialize_config(self):
        """Initialize MongoDB configuration"""
        try:
            # Get MongoDB configuration from environment variables
            self.mongodb_url = os.getenv('MONGODB_URL')
            print("Loaded MONGODB_URL:", self.mongodb_url)  # Debug print
            self.db_name = os.getenv('MONGODB_DATABASE')
            self.use_ssl = os.getenv('MONGODB_USE_SSL', 'false').lower() == 'true'

            # Only use username/password if not already in the URL
            parsed_url = urllib.parse.urlparse(self.mongodb_url)
            if parsed_url.username or parsed_url.password:
                self.username = None
                self.password = None
            else:
                self.username = os.getenv('MONGODB_USERNAME')
                self.password = os.getenv('MONGODB_PASSWORD')

            # Check required fields
            if not all([self.mongodb_url, self.db_name]):
                raise ValueError("Missing required MongoDB configuration. Please check your .env file.")

            # If username or password is provided, both must be provided
            if (self.username and not self.password) or (self.password and not self.username):
                raise ValueError("Both MONGODB_USERNAME and MONGODB_PASSWORD must be provided if either is set.")

            # Construct and validate connection string
            self.connection_string = self._build_connection_string()
            self._validate_connection_string()

            # Initialize client and database references
            self.client = None
            self.db = None

            # Log connection info (safely)
            self._log_connection_info()
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB configuration: {str(e)}")
            raise

    def _validate_connection_string(self):
        """Validate MongoDB connection string"""
        try:
            parsed = urllib.parse.urlparse(self.connection_string)
            if not parsed.scheme or not parsed.netloc:
                raise ValueError("Invalid MongoDB connection string format")
            if not (parsed.scheme and isinstance(parsed.scheme, str) and parsed.scheme.startswith('mongodb')):
                raise ValueError("Invalid MongoDB connection string scheme")
        except Exception as e:
            logger.error(f"Invalid MongoDB connection string: {str(e)}")
            raise

    def _log_connection_info(self):
        """Safely log connection information"""
        try:
            if self.connection_string and isinstance(self.connection_string, str) and '@' in self.connection_string:
                masked_connection = self.connection_string.split('@')[-1]
            else:
                masked_connection = self.connection_string
            logger.info(f"Connecting to MongoDB with URI: {masked_connection}")
            logger.info(f"MongoDB TLS/SSL enabled: {self.use_ssl}")
        except Exception as e:
            logger.warning(f"Failed to log connection info: {str(e)}")

    def _build_connection_string(self) -> Optional[str]:
        """Build and validate MongoDB connection string"""
        try:
            # If the URL already contains username and password, use it as-is
            if self.mongodb_url and "@" in self.mongodb_url:
                return self.mongodb_url
            # Otherwise, build it from username/password and host
            if self.mongodb_url and not self.mongodb_url.startswith(('mongodb://', 'mongodb+srv://')):
                base_url = f'mongodb://{self.mongodb_url}'
            else:
                base_url = self.mongodb_url

            if not self.username or not self.password:
                return base_url

            # URL encode credentials
            encoded_username = urllib.parse.quote_plus(self.username)
            encoded_password = urllib.parse.quote_plus(self.password)

            # Parse and reconstruct URL with auth
            parsed_url = urllib.parse.urlparse(base_url) if base_url else None
            netloc_with_auth = f"{encoded_username}:{encoded_password}@{parsed_url.netloc.split('@')[-1]}" if parsed_url else ''

            return urllib.parse.urlunparse((
                parsed_url.scheme if parsed_url else '',
                netloc_with_auth,
                parsed_url.path if parsed_url else '',
                parsed_url.params if parsed_url else '',
                parsed_url.query if parsed_url else '',
                parsed_url.fragment if parsed_url else ''
            ))
        except Exception as e:
            logger.error(f"Failed to build connection string: {str(e)}")
            raise

    def initialize(self):
        """Initialize MongoDB connection with proper error handling"""
        with self._lock:
            if self.client is not None:
                logger.warning("MongoDB client already initialized")
                return

            try:
                # Build connection options
                options = {
                    "serverSelectionTimeoutMS": 5000,
                    "connectTimeoutMS": 10000,
                    "socketTimeoutMS": 30000,
                    "maxPoolSize": 50,
                    "minPoolSize": 10,
                    "retryWrites": True,
                    "retryReads": True,
                    "tls": self.use_ssl,
                    "appname": 'pogo_api',
                    "heartbeatFrequencyMS": 10000,
                    "maxIdleTimeMS": 60000,
                    "waitQueueTimeoutMS": 10000,
                    "waitQueueMultiple": 10,
                    "maxConnecting": 5,
                    "compressors": ['zlib']
                }

                # Only add authSource if we have credentials
                if self.username and self.password:
                    options["authSource"] = "admin"
                    logger.info("Initializing MongoDB connection with authentication")
                else:
                    logger.info("Initializing MongoDB connection without authentication")

                print("MongoClient connection string:", self.connection_string)  # Debug print
                self.client = MongoClient(self.connection_string, **options)

                if self.db is None and self.client is not None:
                    if self.db_name is not None:
                        self.db = self.client[self.db_name]
                    else:
                        logger.error("Database name is None. Cannot initialize self.db.")
                        self.db = None
                # Test connection
                self._test_connection()
                logger.info("Successfully connected to MongoDB")

            except Exception as e:
                logger.error(f"Failed to connect to MongoDB: {str(e)}")
                self._cleanup_client()
                raise

    def _cleanup_client(self):
        """Clean up MongoDB client resources"""
        if self.client:
            try:
                self.client.close()
            except Exception as e:
                logger.error(f"Error closing MongoDB client: {str(e)}")
            finally:
                self.client = None
                self.db = None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry_error_callback=lambda retry_state: logger.error(f"Failed to connect after {retry_state.attempt_number} attempts")
    )
    def _test_connection(self):
        """Test MongoDB connection with retry logic"""
        try:
            if self.client is not None:
                self.client.admin.command('ping')
                logger.info("MongoDB connection test successful")

                if self.db is None and self.client is not None:
                    if self.db_name is not None:
                        self.db = self.client[self.db_name]
                    else:
                        logger.error("Database name is None. Cannot initialize self.db.")
                        self.db = None

                # Removed list_collection_names() call to avoid authorization issues
                # The ping test above is sufficient to verify connection

        except errors.ServerSelectionTimeoutError:
            logger.error("Could not connect to MongoDB server")
            raise
        except errors.OperationFailure as e:
            logger.error(f"MongoDB operation failed: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during connection test: {str(e)}")
            raise

    def close(self):
        """Close MongoDB connection with proper cleanup"""
        with self._lock:
            self._cleanup_client()

    def _ensure_connection(self):
        """Ensure MongoDB connection is active"""
        if self.client is None or self.db is None:
            self.initialize()

    def _handle_operation_error(self, operation: str, error: Exception) -> None:
        """Handle MongoDB operation errors consistently"""
        logger.error(f"Error during {operation}: {str(error)}")
        if isinstance(error, errors.ServerSelectionTimeoutError):
            self._cleanup_client()
            raise

    def get_documentation(self, query: Dict[str, Any], collection: str) -> Optional[Dict[str, Any]]:
        """Get documentation with proper error handling"""
        try:
            self._ensure_connection()
            if self.db is not None:
                if "_id" in query and isinstance(query["_id"], str):
                    try:
                        query["_id"] = ObjectId(query["_id"])
                    except Exception as conv_err:
                        self._handle_operation_error("get_documentation (ObjectId conversion)", conv_err)
                        return None
                return self.db[collection].find_one(query)
            return None
        except Exception as e:
            self._handle_operation_error("get_documentation", e)
            return None

    def update_documentation(self, query: Dict[str, Any], update: Dict[str, Any], collection: str) -> bool:
        """Update documentation with proper error handling"""
        try:
            self._ensure_connection()
            if self.db is not None:
                result = self.db[collection].update_one(query, {"$set": update})
                return result.modified_count > 0
            return False
        except Exception as e:
            self._handle_operation_error("update_documentation", e)
            return False

    def insert_documentation(self, data: Dict[str, Any], collection: str) -> Optional[ObjectId]:
        """Insert documentation with proper error handling"""
        try:
            self._ensure_connection()
            if self.db is not None:
                result = self.db[collection].insert_one(data)
                return result.inserted_id  # Return ObjectId, not string
            return None
        except Exception as e:
            self._handle_operation_error("insert_documentation", e)
            return None

    def store_documentation(self, data: Dict[str, Any], collection: str) -> bool:
        """Store documentation in MongoDB"""
        try:
            if self.db is not None:
                result = self.db[collection].insert_one(data)
                return result.acknowledged
            return False
        except Exception as e:
            logger.error(f"Error storing documentation: {str(e)}")
            return False

    def get_artifact_update(self, artifact_id: str, processor: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get artifact update from MongoDB"""
        try:
            if self.db is not None:
                query = {"artifact_id": artifact_id}
                if processor:
                    query["processor"] = processor
                # Ensure artifact_id is the correct type for querying if it's not a simple string
                return self.db.artifact_updates.find_one(query)
            return None
        except Exception as e:
            logger.error(f"Error getting artifact update: {str(e)}")
            return None

    def store_artifact_update(self, artifact_id: str, session_id: str, update_type: str, content: str,
                               file_path: str, model: str = "gpt-4", tokens_used: int = 0) -> bool:
        """Store artifact update in MongoDB"""
        try:
            if self.db is not None:
                update_data = {
                    "artifact_id": artifact_id, # Ensure artifact_id is correct type
                    "session_id": session_id,   # Ensure session_id is correct type
                    "update_type": update_type,
                    "content": content,
                    "file_path": file_path,
                    "model": model,
                    "tokens_used": tokens_used,
                    "timestamp": datetime.utcnow()
                }
                result = self.db.artifact_updates.insert_one(update_data)
                return result.acknowledged
            return False
        except Exception as e:
            logger.error(f"Error storing artifact update: {str(e)}")
            return False

    def get_audio_transcription(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get audio transcription from MongoDB"""
        try:
            if self.db is not None:
                # Ensure session_id is correct type
                return self.db.artifact_updates.find_one({
                    "session_id": session_id,
                    "update_type": "audio_transcription"
                })
            return None
        except Exception as e:
            logger.error(f"Error getting audio transcription: {str(e)}")
            return None

    def store_audio_transcription(self, artifact_id: str, session_id: str, transcription: str,
                                 file_path: str, model: str = "whisper-1", duration: float = 0.0) -> bool:
        """Store audio transcription in MongoDB"""
        try:
            if self.db is not None:
                update_data = {
                    "artifact_id": artifact_id, # Ensure artifact_id is correct type
                    "session_id": session_id,   # Ensure session_id is correct type
                    "update_type": "audio_transcription",
                    "content": transcription,
                    "file_path": file_path,
                    "model": model,
                    "duration": duration,
                    "timestamp": datetime.utcnow()
                }
                result = self.db.artifact_updates.insert_one(update_data)
                return result.acknowledged
            return False
        except Exception as e:
            logger.error(f"Error storing audio transcription: {str(e)}")
            return False

    def get_image_analysis(self, artifact_id: str) -> Optional[Dict[str, Any]]:
        """Get image analysis from MongoDB"""
        try:
            if self.db is not None:
                # Ensure artifact_id is correct type
                return self.db.artifact_updates.find_one({
                    "artifact_id": artifact_id,
                    "update_type": "image_analysis"
                })
            return None
        except Exception as e:
            logger.error(f"Error getting image analysis: {str(e)}")
            return None

    def store_image_analysis(self, artifact_id: str, session_id: str, analysis: str,
                            file_path: str, model: str = "gpt-4o", tokens_used: int = 0) -> bool:
        """Store image analysis in MongoDB"""
        try:
            if self.db is not None:
                update_data = {
                    "artifact_id": artifact_id, # Ensure artifact_id is correct type
                    "session_id": session_id,   # Ensure session_id is correct type
                    "update_type": "image_analysis",
                    "content": analysis,
                    "file_path": file_path,
                    "model": model,
                    "tokens_used": tokens_used,
                    "timestamp": datetime.utcnow()
                }
                result = self.db.artifact_updates.insert_one(update_data)
                return result.acknowledged
            return False
        except Exception as e:
            logger.error(f"Error storing image analysis: {str(e)}")
            return False

    # Modified get_user to directly handle ObjectId conversion
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by ID (string representation or ObjectId) from testCollection"""
        try:
            if self.db is not None:
                # Try converting the string ID to ObjectId
                object_id = ObjectId(user_id)
                return self.db.testCollection.find_one({"_id": object_id})
            else:
                logger.error("Database is not initialized.")
                return None
        except InvalidId:
            # If the string is not a valid ObjectId format, log a warning and return None
            logger.warning(f"Invalid ObjectId format for user_id: {user_id}")
            return None
        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            return None

    def get_organization(self, org_id: str) -> Optional[Dict[str, Any]]:
        """Get organization from MongoDB"""
        # This method already correctly uses ObjectId, no change needed here beyond removing the old conversion methods
        try:
            return self.get_documentation(
                {"_id": ObjectId(org_id)},
                "organizations"
            )
        except InvalidId:
             logger.warning(f"Invalid ObjectId format for org_id: {org_id}")
             return None
        except Exception as e:
            logger.error(f"Error getting organization: {str(e)}")
            return None

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project from MongoDB"""
        # This method already correctly uses ObjectId, no change needed here beyond removing the old conversion methods
        try:
            return self.get_documentation(
                {"_id": ObjectId(project_id)},
                "projects"
            )
        except InvalidId:
             logger.warning(f"Invalid ObjectId format for project_id: {project_id}")
             return None
        except Exception as e:
            logger.error(f"Error getting project: {str(e)}")
            return None


    def get_session_artifacts(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all artifacts for a session - Review database schema for efficiency"""
        # NOTE: This method's approach of iterating all collections based on naming convention is inefficient.
        # Consider a schema review to store artifacts in a more directly queryable way.
        try:
            if self.db is not None:
                artifacts = []
                
                # Try to get collections, but handle permission errors gracefully
                try:
                    collections = self.db.list_collection_names()
                except errors.OperationFailure as e:
                    if "not authorized" in str(e).lower():
                        logger.warning("Cannot list collections due to permissions, trying direct collection access")
                        # Try to access the most common collection names directly
                        collections = ["artifacts"]
                    else:
                        raise
                
                for collection in collections:
                    if collection.startswith("artifacts"):
                        # Ensure session_id is correct type for querying
                        cursor = self.db[collection].find({"sessionId": session_id})
                        artifacts.extend(list(cursor))

                return artifacts
            else:
                logger.error("Database is not initialized.")
                return []
        except Exception as e:
            logger.error(f"Error getting session artifacts: {str(e)}")
            return []

    def get_session_updates(self, session_id: str) -> List[Dict]:
        """Get all updates for a session - Review database schema for efficiency"""
        # NOTE: This method's approach of iterating all collections based on naming convention is inefficient.
        # Consider a schema review to store updates in a more directly queryable way.
        try:
            if self.db is not None:
                updates = []
                
                # Try to get collections, but handle permission errors gracefully
                try:
                    collections = self.db.list_collection_names()
                except errors.OperationFailure as e:
                    if "not authorized" in str(e).lower():
                        logger.warning("Cannot list collections due to permissions, trying direct collection access")
                        # Try to access the most common collection names directly
                        collections = ["artifact_updates"]
                    else:
                        raise
                
                for collection in collections:
                    if collection.endswith("_updates"):
                        # Ensure session_id is correct type for querying
                        cursor = self.db[collection].find({"session_id": session_id})
                        updates.extend(list(cursor))

                return updates
            else:
                logger.error("Database is not initialized.")
                return []
        except Exception as e:
            logger.error(f"Error getting session updates: {str(e)}")
            return []

    def store_artifact_vector(self, artifact_id: str, session_id: str, vector: List[float],
                               model: str = "text-embedding-3-small", tokens_used: int = 0) -> bool:
        """Store artifact vector in MongoDB"""
        try:
            if self.db is not None:
                vector_data = {
                    "artifact_id": artifact_id, # Ensure artifact_id is correct type
                    "session_id": session_id,   # Ensure session_id is correct type
                    "vector": vector,
                    "model": model,
                    "tokens_used": tokens_used,
                    "timestamp": datetime.utcnow()
                }

                # Ensure artifact_id in the query is the correct type
                result = self.db.artifact_vectors.update_one(
                    {"artifact_id": artifact_id},
                    {"$set": vector_data},
                    upsert=True
                )
                return result.acknowledged
            else:
                logger.error("Database is not initialized.")
                return False
        except Exception as e:
            logger.error(f"Error storing artifact vector: {str(e)}")
            return False

    def get_artifact_vectors(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all artifact vectors for a session"""
        try:
            if self.db is not None:
                # Ensure session_id is correct type
                query = {"session_id": session_id}
                vectors = list(self.db["artifact_vectors"].find(query))
                return vectors
            else:
                logger.error("Database is not initialized.")
                return []
        except Exception as e:
            logger.error(f"Error getting artifact vectors: {str(e)}")
            return []

    def create_chat_session(self, session_data: Dict[str, Any]) -> str:
        """Create a new chat session - Ensure session_data has correct BSON types if needed"""
        try:
            if self.db is not None:
                # Ensure session_data has correct BSON types (like ObjectId for _id or other references)
                result = self.db["chat_sessions"].insert_one(session_data)
                return str(result.inserted_id) # Returns string representation of ObjectId
            else:
                logger.error("Database is not initialized.")
                return ""
        except Exception as e:
            logger.error(f"Error creating chat session: {str(e)}")
            return ""

    def get_chat_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a chat session by ID (string representation or ObjectId)"""
        try:
            if self.db is not None:
                # Convert session_id string to ObjectId for querying by _id
                object_id = ObjectId(session_id)
                session = self.db["chat_sessions"].find_one({"_id": object_id})
                return session
            else:
                logger.error("Database is not initialized.")
                return None
        except InvalidId:
             logger.warning(f"Invalid ObjectId format for session_id: {session_id}")
             return None
        except Exception as e:
            logger.error(f"Error getting chat session: {str(e)}")
            return None

    def update_chat_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a chat session by ID (string representation or ObjectId)"""
        try:
            if self.db is not None:
                # Convert session_id string to ObjectId for querying by _id
                object_id = ObjectId(session_id)
                # Ensure update_data has correct BSON types if needed
                result = self.db["chat_sessions"].update_one(
                    {"_id": object_id},
                    {"$set": update_data}
                )
                return result.modified_count > 0
            else:
                logger.error("Database is not initialized.")
                return False
        except InvalidId:
             logger.warning(f"Invalid ObjectId format for session_id: {session_id}")
             return False
        except Exception as e:
            logger.error(f"Error updating chat session: {str(e)}")
            return False

    def get_chat_sessions(self, project_id: str, user_id: str, status: str = "active") -> List[Dict[str, Any]]:
        """Get all chat sessions for a project and user"""
        try:
            if self.db is not None:
                # Ensure project_id and user_id are correct types for querying
                cursor = self.db["chat_sessions"].find({
                    "project_id": project_id,
                    "user_id": user_id,
                    "status": status
                })
                return list(cursor)
            else:
                logger.error("Database is not initialized.")
                return []
        except Exception as e:
            logger.error(f"Error getting chat sessions: {str(e)}")
            return []

    def add_chat_message(self, message_data: Dict[str, Any]) -> bool:
        """Add a message to a chat session - Ensure message_data has correct BSON types if needed"""
        try:
            # Ensure message_data has correct BSON types (like ObjectId for session_id or other references)
            if self.db is not None:
                result = self.db["chat_messages"].insert_one(message_data)
                return result.acknowledged
            else:
                logger.error("Database is not initialized.")
                return False
        except Exception as e:
            logger.error(f"Error adding chat message: {str(e)}")
            return False

    def get_chat_messages(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a chat session"""
        try:
            # Ensure session_id is correct type for querying
            if self.db is not None:
                cursor = self.db["chat_messages"].find({
                    "session_id": session_id
                })
                return list(cursor)
            else:
                logger.error("Database is not initialized.")
                return []
        except Exception as e:
            logger.error(f"Error getting chat messages: {str(e)}")
            return []

    def delete_artifact_vector(self, artifact_id: str) -> bool:
        """Delete an artifact vector"""
        try:
             # Ensure artifact_id is correct type for querying
            if self.db is not None:
                result = self.db.artifact_vectors.delete_one({
                    "artifact_id": artifact_id
                })
                return result.deleted_count > 0
            else:
                logger.error("Database is not initialized.")
                return False
        except Exception as e:
            logger.error(f"Error deleting artifact vector: {str(e)}")
            return False

    def store_email_verification_code(self, email: str, code: str, expires_at: datetime):
        if self.db is not None:
            collection = self.db['email_verification_codes']
            collection.update_one(
                {"email": email},
                {"$set": {"code": code, "expires_at": expires_at}},
                upsert=True
            )
        else:
            logger.error("Database is not initialized.")

    def get_email_verification_code(self, email: str):
        if self.db is not None:
            collection = self.db['email_verification_codes']
            return collection.find_one({"email": email})
        else:
            logger.error("Database is not initialized.")
            return None

    def delete_email_verification_code(self, email: str):
        if self.db is not None:
            collection = self.db['email_verification_codes']
            collection.delete_one({"email": email})
        else:
            logger.error("Database is not initialized.")

    def store_extension_token(self, token_data: Dict[str, Any]) -> bool:
        try:
            self._ensure_connection()
            if self.db is not None:
                self.db.extension_tokens.insert_one(token_data)
                return True
            else:
                logger.error("Database is not initialized.")
                return False
        except Exception as e:
            logger.error(f"Failed to store extension token: {str(e)}")
            return False

    def get_extension_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            self._ensure_connection()
            if self.db is not None:
                return self.db.extension_tokens.find_one({"token": token, "status": {"$ne": "revoked"}})
            else:
                logger.error("Database is not initialized.")
                return None
        except Exception as e:
            logger.error(f"Failed to get extension token: {str(e)}")
            return None

    def update_extension_token(self, token: str, update: Dict[str, Any]) -> bool:
        try:
            self._ensure_connection()
            if self.db is not None:
                self.db.extension_tokens.update_one({"token": token}, {"$set": update})
                return True
            else:
                logger.error("Database is not initialized.")
                return False
        except Exception as e:
            logger.error(f"Failed to update extension token: {str(e)}")
            return False

    def revoke_extension_token(self, token: str) -> bool:
        return self.update_extension_token(token, {"status": "revoked"})

# @lru_cache()
def get_mongodb_client() -> MongoDBClient:
    """Get MongoDB client instance and ensure it's initialized"""
    try:
        
        client = MongoDBClient()
        if client.db is None:
            client.initialize()
        return client
    except Exception as e:
        logger.error(f"Failed to get MongoDB client: {str(e)}")
        raise

# async def get_db() -> MongoDBClient:
#     """Get MongoDB client instance asynchronously"""
#     try:
#         return get_mongodb_client()
#     except Exception as e:
#         logger.error(f"Failed to get MongoDB client: {str(e)}")
#         raise


# Optional: Add this if you want to create the singleton instance when the module is imported
# Although initializing on first call to get_mongodb_client() or application startup might be preferred.
# try:
#     # Attempt to initialize the singleton when the module is imported
#     get_mongodb_client()
# except Exception as e:
#     logger.error(f"Failed to initialize MongoDB client on import: {e}")
#     # Depending on application design, you might re-raise or handle differently