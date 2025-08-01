import os
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from bson.errors import InvalidId
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError
from pogoapi.models.session_models import SessionRequest, SessionCreate, SessionUpdate
from pogoapi.services.artifact_chain_service import ArtifactChainService
from pogoapi.utils.path_utils import PathBuilder
import logging
from pogoapi.utils.global_services import chain_service, path_builder, vectorization_service
from pogoapi.services.artifact_service import list_artifacts
from pymongo.errors import DuplicateKeyError
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.services.vectorization_service import VectorizationService
import base64
from dotenv import load_dotenv
from openai import OpenAI
from pogoapi.config import config

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the absolute path to the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Get the parent directory of the project root
PARENT_DIR = os.path.dirname(PROJECT_ROOT)
# Define the base upload folder as an absolute path at the same level as project root
BASE_UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "hellopogo")

class SessionService:
    def __init__(self):
        self.llm_config = config.get_llm_config()
        self.db_client = get_mongodb_client()
        
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.openai_client = OpenAI(api_key=api_key)
        
        # Initialize services
        self.chain_service = chain_service or ArtifactChainService(self.openai_client, self.db_client)
        self.path_builder = path_builder or PathBuilder(self.db_client, BASE_UPLOAD_FOLDER)

        self.vectorization_service = vectorization_service or VectorizationService(
            self.openai_client, self.db_client
        )

    def process_session(self, session_id: str) -> dict:
        """
        Process all artifacts for a session.
        First processes audio, then processes images in chronological order.
        Finally generates documentation for each artifact.
        """
        import os
        from pogoapi.services.artifact_service import parse_artifact_id
        try:
            session_object_id = ObjectId(session_id)
        except:
            raise BadRequest("Invalid session ID format")

        try:
            db = get_mongodb_client()
            if db.db is None:
                raise InternalServerError("MongoDB not initialized")
            # Get artifacts for this session from artifacts collection
            artifacts = list(db.db["artifacts"].find({"sessionId": session_object_id}))
            artifact_source = 'artifacts collection'
            if not artifacts:
                # Try to get artifacts from the session document's artifacts array
                session_doc = db.db["testCollection"].find_one({"_id": session_object_id})
                if session_doc and "artifacts" in session_doc:
                    artifacts = session_doc["artifacts"]
                    artifact_source = 'session document'
                else:
                    artifacts = []
            logger.info(f"[Process All] Found {len(artifacts)} artifacts from {artifact_source} for session {session_id}")
            processed_count = 0
            queued_tasks = []
            from pogoapi.tasks.processing_tasks import process_audio, process_image
            supported_types = {"audio", "image", "screenshot"}
            for artifact in artifacts:
                artifact_id = artifact.get("_id")
                url = artifact.get("url")
                if not url:
                    logger.warning(f"[Process All] Artifact {artifact_id} has no url, skipping.")
                    continue
                url_parts = url.lstrip('/').split('/')
                repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # project root
                if url_parts[0] == "storage":
                    file_path = os.path.abspath(os.path.join(repo_root, "storage", *url_parts[1:]))
                else:
                    file_path = os.path.abspath(os.path.join(repo_root, *url_parts))
                logger.info(f"[Process All] Artifact {artifact_id} from {artifact_source}, resolved file path: {file_path}, cwd: {os.getcwd()}")
                capture_type = artifact.get("captureType")
                if capture_type not in supported_types:
                    logger.warning(f"[Process All] Skipping unsupported artifact type: {capture_type} for artifact {artifact_id}")
                    continue
                # Ensure session_id is always set for the artifact
                artifact_session_id = artifact.get("sessionId") or session_id
                # Use Celery tasks for processing
                try:
                    if capture_type == "audio":
                        task = process_audio.delay(
                            artifact_id=str(artifact_id),
                            session_id=str(artifact_session_id),
                            priority="medium"
                        )
                    elif capture_type in ("image", "screenshot"):
                        task = process_image.delay(
                            artifact_id=str(artifact_id),
                            session_id=str(artifact_session_id),
                            priority="medium"
                        )
                    else:
                        logger.warning(f"[Process All] Should not reach here, unsupported type: {capture_type}")
                        continue
                    queued_tasks.append({"artifactId": str(artifact_id), "task_id": task.id, "type": capture_type})
                    processed_count += 1
                except Exception as e:
                    logger.error(f"[Process All] Failed to queue Celery task for artifact {artifact_id}: {e}")
            logger.info(f"[Process All] Queued {processed_count}/{len(artifacts)} artifacts for session {session_id}")
            return {"message": f"Queued {processed_count}/{len(artifacts)} artifacts for processing", "status": "success", "tasks": queued_tasks}
        except Exception as e:
            logger.exception(f"Error processing session {session_id}: {e}")
            raise InternalServerError(f"Error processing session: {e}")
    def publish_by_session_id(self, session_id) -> dict:
        """
        Retrieves all artifacts for a given session ID.
        """
        try:
            # Validate session ID format
            try:
                session_object_id = ObjectId(session_id)
            except Exception:
                raise BadRequest(f"Invalid session ID format: {session_id}")

            # Retrieve artifacts from the database
            db = get_mongodb_client()
            artifacts = list(db.db["artifact_updates"].find({"sessionId": session_object_id}))

            # Ensure vectorization_service is initialized
            if self.vectorization_service is None:
                raise InternalServerError("Vectorization service is not initialized.")

            # Convert ObjectId fields to strings for JSON serialization
            for artifact in artifacts:
                content=artifact.get("content", "")
                if isinstance(content, tuple):
                    content = ' '.join(map(str, content))
                artifact_id=str(artifact["_id"])
                # session_id=session_id,
                metadata={
                    "processor": artifact.get("processor", ""),
                }
                
                # Optionally create vectors for each artifact's content (e.g., for semantic search)
                self.vectorization_service.create_vectors(content, artifact_id, session_id, metadata)
                    

            return {
                "sessionId": session_id,
                # "artifacts": artifacts
            }
        except Exception as e:
            raise InternalServerError(f"Error retrieving session artifacts: {str(e)}")

    def vectorize_session_texts(self, session_id: str) -> dict:
        """Vectorize all processed texts for artifacts in a session."""
        try:
            db = get_mongodb_client()
            # Find all processed artifact_updates for this session
            processed_updates = list(db.db["artifact_updates"].find({
                "sessionId": session_id,
                "status": "processed"
            }))
            if not processed_updates:
                return {"message": "No processed texts found for session", "sessionId": session_id}
            results = []
            for update in processed_updates:
                content = update.get("content", "")
                artifact_id = update.get("artifactId")
                metadata = {"processor": update.get("processor", "")}
                result = self.vectorization_service.create_vectors(content, artifact_id, session_id, metadata)
                results.append(result)
            return {
                "message": f"Vectorized {len(results)} processed texts",
                "sessionId": session_id,
                "results": results
            }
        except Exception as e:
            return {"error": str(e), "sessionId": session_id}

def create_session(session_data: dict):
    """Creates a new session."""
    if "projectId" not in session_data or "createdBy" not in session_data:
        raise BadRequest("ProjectId and creator are required")

    try:
        session_data["projectId"] = ObjectId(session_data["projectId"])
        session_data["createdBy"] = ObjectId(session_data["createdBy"])
    except Exception:
        raise BadRequest("Invalid ID format")

    # Ensure 'name' field exists
    if "name" not in session_data or not session_data["name"]:
        session_data["name"] = "Unknown"

    try:
        db = get_mongodb_client()
        if db.db is None:
            raise InternalServerError("MongoDB not initialized")
        session_data["createdAt"] = datetime.now(timezone.utc)
        session_data["status"] = "draft"
        session_data["artifacts"] = []  # Add artifacts array

        inserted_session = db.db["testCollection"].insert_one(session_data)
        logger.info(f"Session inserted: {session_data}, inserted_id: {inserted_session.inserted_id}")
        return {"message": "Session created", "sessionId": str(inserted_session.inserted_id)}
    except Exception as e:
        raise InternalServerError(f"Failed to create session: {str(e)}")

def delete_session(sessionId: str):
    try:
        session_object_id = ObjectId(sessionId)
    except (InvalidId, TypeError):
        raise BadRequest("Invalid session ID format")

    try:
        db = get_mongodb_client()
        if db.db is None:
            raise InternalServerError("MongoDB not initialized")
        
        result = db.db["testCollection"].delete_one({"_id": session_object_id})
        if result.deleted_count == 0:
            raise NotFound("Session not found")

        return {"message": "Session deleted", "sessionId": sessionId}
    
    except Exception as e:
        if isinstance(e, NotFound):
            raise
        raise InternalServerError(f"Failed to delete session: {str(e)}")

# def get_storage_path(sessionId: str):
#     """Generate storage path based on organization, project, and session."""
#     try:
#         session_object_id = ObjectId(sessionId)
#     except:
#         raise BadRequest("Invalid session ID format")

#     try:
#         db = get_mongodb_client() 
#         session = db.db.sessions.find_one({"_id": session_object_id})
#         if not session:
#             raise NotFound("Session not found")

#         try:
#             project_object_id = ObjectId(session["projectId"])
#         except:
#             raise BadRequest("Invalid project ID format in session")

#         project = db.db.projects.find_one({"_id": project_object_id})
#         if not project:
#             raise NotFound("Project not found")

#         try:
#             org_object_id = ObjectId(project["organization"])
#         except:
#             raise BadRequest("Invalid organization ID format in project")

#         organization = db.db.organizations.find_one({"_id": org_object_id})
#         if not organization:
#             raise NotFound("Organization not found")

#         org_slug = slugify(organization["name"])
#         project_slug = slugify(project["name"])
        
#         # Create the full storage path using absolute path
#         storage_path = os.path.join(BASE_UPLOAD_FOLDER, org_slug, project_slug, str(session_object_id))
#         # Create the directory if it doesn't exist
#         os.makedirs(storage_path, exist_ok=True)

#         # Return the relative path for URL purposes
#         return f"hellopogo/{org_slug}/{project_slug}/{str(session_object_id)}"
#     except Exception as e:
#         if isinstance(e, (BadRequest, NotFound)):
#             raise
#         raise InternalServerError(f"Failed to get storage path: {str(e)}")

def list_sessions_by_project(projectId: str):
    """
    List all sessions in a project.

    Args:
        projectId (str): Project's MongoDB ObjectId

    Returns:
        list: List of sessions in the project

    Raises:
        BadRequest: If project ID format is invalid
    """
    try:
        project_object_id = ObjectId(projectId)
    except:
        raise BadRequest("Invalid project ID format")

    try:
        db = get_mongodb_client()
        if db.db is None:
            raise InternalServerError("MongoDB not initialized")
        
        session_list = []
        sessions = list(db.db["testCollection"].find({"projectId": project_object_id}).limit(100))
        if not sessions:
            return session_list
        
        for session in sessions:
            print(f"[Session] ID: {session['_id']}")
            artifact_list = session.get("artifacts", [])
            image_count = len([a for a in artifact_list if a.get("captureType") in ("image", "screenshot")])
            audio_count = len([a for a in artifact_list if a.get("captureType") == "audio"])
            duration = 0

            session_data = {
                "_id": str(session["_id"]),
                "name": session.get("name", "Unknown"),
                "createdAt": session.get("createdAt"),
                "createdBy": str(session.get("createdBy", "")),
                "projectId": str(session.get("projectId", "")),
                "status": session.get("status", "unknown"),
                "artifacts": artifact_list,
                "imageCount": image_count,
                "audioCount": audio_count,
                "duration": duration
            }
            session_list.append(session_data)

        return session_list

    except Exception as e:
        if isinstance(e, NotFound):
            raise
        raise InternalServerError(f"Failed to list sessions: {str(e)}")

def update_session(session_id, session_data):
    """
    Updates a session by its ID.

    Args:
        session_id (str): The ID of the session to update.
        session_data (dict): The data to update the session with.

    Returns:
        dict: A dictionary containing the result of the update.
    """
    # Ensure 'name' field exists if updating name
    if "name" in session_data and not session_data["name"]:
        session_data["name"] = "Unknown"
    try:
        db = get_mongodb_client()
        result = db.db["testCollection"].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": session_data}
        )
        if result.matched_count == 0:
            raise NotFound(f"Session with ID {session_id} not found.")
        return {"success": True, "message": f"Session with ID {session_id} has been updated."}
    except Exception as e:
        raise InternalServerError(f"Error updating session: {str(e)}")
    

def get_session_by_id(session_id):
    """
    Retrieves a session by its ID.

    Args:
        session_id (str): The ID of the session to retrieve.

    Returns:
        dict: A dictionary containing the session details.
    """
    try:
        # Validate session ID format
        try:
            session_object_id = ObjectId(session_id)
        except Exception:
            raise BadRequest(f"Invalid session ID format: {session_id}")

        # Retrieve session from the database
        db = get_mongodb_client()
        session = db.db["sessions"].find_one({"_id": session_object_id})
        if not session:
            raise NotFound(f"Session with ID {session_id} not found.")

        # Convert ObjectId fields to strings for JSON serialization
        session["_id"] = str(session.pop("_id"))
        if "projectId" in session:
            session["projectId"] = str(session["projectId"])
        if "createdBy" in session:
            session["createdBy"] = str(session["createdBy"])

        artifacts = list_artifacts(session["_id"]) or {}
        artifact_list = artifacts.get("artifacts", [])

        # Optional: count by type
        session["imageCount"] = len([a for a in artifact_list if a.get("captureType") == "image"])
        session["audioCount"] = len([a for a in artifact_list if a.get("captureType") == "audio"])
        session["duration"] = 0

        project = db.db["projects"].find_one({"_id": ObjectId(session["projectId"])})
        if project:
            session["projectName"] = project.get("name", "Unknown Project")
        else:
            session["projectName"] = "Unknown Project"

        # Add session name (default to 'Unknown' if missing)
        session["name"] = session.get("name", "Unknown")

        # Add additional fields or transformations if needed
        return session

    except BadRequest as e:
        logger.error(f"BadRequest: {str(e)}")
        raise
    except NotFound as e:
        logger.error(f"NotFound: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"InternalServerError: {str(e)}")
        raise InternalServerError(f"Error retrieving session: {str(e)}")
    
def get_artifacts_by_session_id(session_id):
    """
    Retrieves all artifacts for a given session ID.

    Args:
        session_id (str): The ID of the session.

    Returns:
        list: A list of dictionaries containing artifact details.
    """
    try:
        # Validate session ID format
        try:
            session_object_id = ObjectId(session_id)
        except Exception:
            raise BadRequest(f"Invalid session ID format: {session_id}")

        # Retrieve artifacts from the database
        db = get_mongodb_client()
        artifacts = list(db.db["artifacts"].find({"sessionId": session_object_id}))

        # Convert ObjectId fields to strings for JSON serialization
        for artifact in artifacts:
            artifact["_id"] = str(artifact["_id"])
            if "sessionId" in artifact:
                artifact["sessionId"] = str(artifact["sessionId"])

        artifact_updates = list(db.db["artifact_updates"].find({"sessionId": session_object_id, "status": "processed"}))

        # Convert ObjectId fields to strings for JSON serialization
        for artifact_update in artifact_updates:
            artifact_update["_id"] = str(artifact_update["_id"])
            if "sessionId" in artifact_update:
                artifact_update["sessionId"] = str(artifact_update["sessionId"])
            if "artifactId" in artifact_update:
                artifact_update["artifactId"] = str(artifact_update["artifactId"])

        return {
            "artifacts" : artifacts,
            "artifact_updates": artifact_updates,
            }
    except Exception as e:
        raise InternalServerError(f"Error retrieving artifacts: {str(e)}")
    
def get_session_artifacts(session_id: str) -> list:
    """Return all artifacts for a given session ID."""
    db = get_mongodb_client()
    try:
        artifacts = list(db.db["artifacts"].find({"sessionId": ObjectId(session_id)}))
        for artifact in artifacts:
            artifact["_id"] = str(artifact["_id"])
            if "sessionId" in artifact:
                artifact["sessionId"] = str(artifact["sessionId"])
            if "projectId" in artifact:
                artifact["projectId"] = str(artifact["projectId"])
        return artifacts
    except Exception as e:
        import logging
        logging.error(f"Error fetching artifacts for session {session_id}: {e}")
        return []
    
def process_session_artifacts(session_id: str) -> dict:
    """Process all artifacts for a given session using the artifact chain service."""
    try:
        # Get all artifacts for the session
        artifacts = get_session_artifacts(session_id)
        
        if not artifacts:
            return {"message": "No artifacts found for session", "processed": 0}
        
        # Initialize artifact chain service
        from pogoapi.services.artifact_chain_service import ArtifactChainService
        from pogoapi.utils.mongodb_client import get_mongodb_client
        from openai import OpenAI
        
        db_client = get_mongodb_client()
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        chain_service = ArtifactChainService(openai_client=openai_client, db_client=db_client)
        
        processed_count = 0
        results = []
        
        for artifact in artifacts:
            try:
                # Process each artifact
                result = chain_service.process_artifact(
                    artifact_data=artifact.get("content", ""),
                    metadata={
                        "_id": artifact["_id"],
                        "sessionId": session_id,
                        "captureType": artifact.get("captureType", "unknown")
                    }
                )
                results.append(result)
                processed_count += 1
                
            except Exception as e:
                import logging
                logging.error(f"Error processing artifact {artifact['_id']}: {e}")
                results.append({"error": str(e), "artifact_id": artifact["_id"]})
        
        return {
            "message": f"Processed {processed_count} artifacts",
            "processed": processed_count,
            "total": len(artifacts),
            "results": results
        }
        
    except Exception as e:
        import logging
        logging.error(f"Error processing session artifacts: {e}")
        return {"error": str(e), "processed": 0}
    
def migrate_artifacts_to_sessions():
    """
    Move all artifacts from the artifacts collection into the corresponding session's artifacts array in testCollection.
    """
    db = get_mongodb_client()
    artifacts = list(db.db["artifacts"].find({}))
    for artifact in artifacts:
        session_id = artifact.get("sessionId")
        if not session_id:
            continue
        # Remove MongoDB _id to avoid duplicate key error when pushing
        artifact_copy = dict(artifact)
        artifact_copy.pop("_id", None)
        db.db["testCollection"].update_one(
            {"_id": session_id if isinstance(session_id, ObjectId) else ObjectId(session_id)},
            {"$push": {"artifacts": artifact_copy}}
        )
    
