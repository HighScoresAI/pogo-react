import os
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from flask import request
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError
from bson import ObjectId
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.utils.storage_utils import get_storage_path, BASE_UPLOAD_FOLDER
from pogoapi.models.artifact_models import ArtifactCreate, ArtifactResponse, ArtifactUpdateRecord
import uuid
import logging
from pogoapi.utils.path_utils import PathBuilder
from pogoapi.utils.global_services import chain_service, path_builder
from openai import OpenAI
from pogoapi.services.artifact_chain_service import ArtifactChainService

# Configure logger
logger = logging.getLogger(__name__)

class ArtifactService:
    def __init__(self):
        self.db_client = get_mongodb_client()
        self.db = self.db_client.db

        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        self.openai_client = OpenAI(api_key=api_key)
        
        # Initialize services
        self.chain_service = chain_service or ArtifactChainService(self.openai_client, self.db_client)
        self.path_builder = path_builder or PathBuilder(BASE_UPLOAD_FOLDER)

    def upload_audio(self, sessionId: str, file):
        """Handles audio upload when a session ends."""
        try:
            session_object_id = ObjectId(sessionId)
        except:
            raise BadRequest("Invalid session ID format")

        if not file or not file.filename:
            raise BadRequest("No file provided")
        
        filename_parts = file.filename.rsplit(".", 1)
        if len(filename_parts) < 2 or filename_parts[1].lower() not in ["wav", "mp3", "m4a", "flac", "webm"]:
            raise BadRequest("Only .wav, .mp3, .m4a, .flac, and .webm files are allowed")

        file_extension = filename_parts[1]
        
        # Check file size (500MB limit)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 500 * 1024 * 1024:  # 500MB
            raise BadRequest(f"File size {file_size / (1024*1024):.1f}MB exceeds the maximum limit of 500MB")
        
        # Check audio duration (3 hours limit) - basic check
        # This is a rough estimate based on file size
        # For more accurate duration checking, you'd need to analyze the audio file
        estimated_duration_hours = file_size / (1024 * 1024 * 128)  # Rough estimate: 128kbps
        if estimated_duration_hours > 3:
            raise BadRequest(f"Estimated audio duration {estimated_duration_hours:.1f} hours exceeds the maximum limit of 3 hours")

        try:
            db = get_mongodb_client()

            base_dir = os.path.dirname(os.path.abspath(__file__))
            project_dir = os.path.join(base_dir, "..")
            storage_path = get_storage_path(sessionId, db)
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_url = f"{storage_path}/{unique_filename}"
            file_location = os.path.join(*file_url.split("/"))
            os.makedirs(os.path.dirname(file_location), exist_ok=True)

            file_location = os.path.join(project_dir,  "hellopogo/" + file_location)
            file.seek(0)
            with open(file_location, "wb") as buffer:
                buffer.write(file.read())

            artifact_data = {
                "sessionId": session_object_id,
                "captureType": "audio",
                "captureName": file.filename,
                "url": file_url,
                "captureDate": datetime.now(timezone.utc),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc)
            }

            
            inserted_artifact = db.db.artifacts.insert_one(artifact_data)
            
            return {
                "message": "Audio uploaded",
                "artifactId": str(inserted_artifact.inserted_id),
                "url": file_url,
                "originalName": file.filename
            }
        except Exception as e:
            if isinstance(e, (BadRequest, NotFound)):
                raise
            raise InternalServerError(f"Error uploading audio: {str(e)}")

    def upload_image(self, sessionId: str, file):
        """Handles image uploads on demand."""
        try:
            session_object_id = ObjectId(sessionId)
        except:
            raise BadRequest("Invalid session ID format")

        if not file or not file.filename:
            raise BadRequest("No file provided")

        filename_parts = file.filename.rsplit(".", 1)
        if len(filename_parts) < 2 or filename_parts[1].lower() not in ["jpg", "jpeg", "png", "gif", "webp"]:
            raise BadRequest("Only .jpg, .jpeg, .png, .gif, and .webp files are allowed")

        file_extension = filename_parts[1]
        
        # Check file size (50MB limit)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 50 * 1024 * 1024:  # 50MB
            raise BadRequest(f"File size {file_size / (1024*1024):.1f}MB exceeds the maximum limit of 50MB")

        try:
            db = get_mongodb_client()
            
            base_dir = os.path.dirname(os.path.abspath(__file__))
            project_dir = os.path.join(base_dir, "..")
            storage_path = get_storage_path(sessionId, db)

            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_url = f"{storage_path}/{unique_filename}"
            file_location = os.path.join(*file_url.split("/"))

            os.makedirs(os.path.dirname(file_location), exist_ok=True)
            file_location = os.path.join(project_dir, "hellopogo/" + file_location)
            file.seek(0)
            with open(file_location, "wb") as buffer:
                buffer.write(file.read())

            artifact_data = {
                "sessionId": session_object_id,
                "captureType": "image",
                "captureName": file.filename,
                "url": file_url,
                "captureDate": datetime.now(timezone.utc),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc)
            }

            inserted_artifact = db.db.artifacts.insert_one(artifact_data)
            return {"message": "Image uploaded", "artifactId": str(inserted_artifact.inserted_id)}
        except Exception as e:
            if isinstance(e, (BadRequest, NotFound)):
                raise
            raise InternalServerError(f"Error uploading image: {str(e)}")

    def list_artifacts(self, sessionId: str):
        """Retrieves all artifacts for a given session."""
        try:
            session_object_id = ObjectId(sessionId)
        except:
            raise BadRequest("Invalid session ID format")

        try:
            db = get_mongodb_client()
            artifacts = list(db.db.artifacts.find({"sessionId": session_object_id}))
            if not artifacts:
                return {"artifacts": [], "sessionId": str(session_object_id)}

            artifact_responses = []
            for artifact in artifacts:
                latest_update = db.db.artifact_updates.find_one(
                    {"artifactId": str(artifact["_id"])},
                    sort=[("processedAt", -1)]
                )

                response = ArtifactResponse(
                    id=str(artifact["_id"]),
                    sessionId=str(artifact["sessionId"]),
                    captureType=artifact["captureType"],
                    captureName=artifact["captureName"],
                    url=artifact["url"],
                    captureDate=artifact["captureDate"],
                    processedText=latest_update.get("processedText") if latest_update else None,
                    status=latest_update.get("status") if latest_update else None,
                    processedAt=latest_update.get("processedAt") if latest_update else None
                )
                artifact_responses.append(response)

            return {
                "artifacts": [ar.dict() for ar in artifact_responses],
                "sessionId": str(session_object_id)
            }
        except Exception as e:
            if isinstance(e, (BadRequest, NotFound)):
                raise
            raise InternalServerError(f"Error listing artifacts: {str(e)}")

    def delete_artifact_by_id(self, artifact_id):
        """Deletes an artifact by its ID."""
        try:
            artifact_object_id = parse_artifact_id(artifact_id)
            db = get_mongodb_client()
            result = db.db.artifacts.delete_one({"_id": artifact_object_id})
            if result.deleted_count == 0:
                raise NotFound(f"Artifact with ID {artifact_id} not found.")

            return {"success": True, "message": f"Artifact with ID {artifact_id} has been deleted."}
        except Exception as e:
            raise InternalServerError(f"Error deleting artifact: {str(e)}")
        
    def process_artifact_by_id(self, artifact_id, priority='medium'):
        """
        Process artifact by id using background queue.
        
        Args:
            artifact_id: Artifact ID
            priority: Processing priority (high/medium/low)
            
        Returns:
            dict: Processing result with task ID
        """
        import os
        try:
            artifact_object_id = parse_artifact_id(artifact_id)
        except Exception as e:
            raise BadRequest(f"Invalid artifact ID format: {artifact_id}")

        try:
            db = get_mongodb_client()
            if db.db is None:
                raise InternalServerError("MongoDB not initialized")
            
            # Try main artifacts collection first
            artifact = db.db.artifacts.find_one({"_id": artifact_object_id})
            session_id = None
            artifact_source = 'artifacts collection'
            if not artifact:
                # Try to find in testCollection (sessions)
                artifact, session = find_artifact_in_sessions(artifact_id)
                artifact_source = 'session document'
                if not artifact:
                    return {"message": "No artifact found", "artifactId": artifact_id}
                session_id = session["_id"]
            else:
                session_id = artifact.get("sessionId")

            # Log resolved file path and cwd
            url = artifact.get("url")
            file_path = None
            if url:
                project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                url_parts = url.lstrip("/").split("/")
                file_path = os.path.join(project_root, *url_parts)
                logger.info(f"[Individual] Artifact {artifact_id} from {artifact_source}, resolved file path: {file_path}, cwd: {os.getcwd()}")
            else:
                logger.info(f"[Individual] Artifact {artifact_id} from {artifact_source}, no url field.")

            logger.info(f"Queuing artifact {artifact_id} for processing with priority {priority}")
            
            # Import tasks here to avoid circular imports
            from pogoapi.tasks.processing_tasks import process_audio, process_image
            
            # Queue processing task based on artifact type
            if artifact.get("captureType") == "audio":
                task = process_audio.delay(
                    artifact_id=str(artifact["_id"]),
                    session_id=str(session_id),
                    priority=priority
                )
            elif artifact.get("captureType") in ("image", "screenshot"):
                task = process_image.delay(
                    artifact_id=str(artifact["_id"]),
                    session_id=str(session_id),
                    priority=priority
                )
            else:
                raise BadRequest(f"Unsupported artifact type: {artifact.get('captureType')}")
            
            # Update artifact status to processing
            db.db.artifact_updates.insert_one({
                "artifactId": artifact_id,
                "sessionId": session_id,
                "status": "processing",
                "task_id": task.id,
                "priority": priority,
                "createdAt": datetime.now(timezone.utc)
            })
                            
            return {
                "message": "Artifact queued for processing",
                "artifactId": artifact_id,
                "task_id": task.id,
                "status": "queued",
                "priority": priority
            }
        except Exception as e:
            if isinstance(e, BadRequest):
                raise
            raise InternalServerError(f"Failed to queue artifact processing: {str(e)}")
        
    def update_artifact_content_by_id(self, artifact_id, content):
        """
        Update artifact content by id.
        
        Args:
            artifact_id: Artifact ID
            
        Returns:
            dict: Updating result
        """
        try:
            artifact_object_id = parse_artifact_id(artifact_id)
        except Exception as e:
            raise BadRequest(f"Invalid artifact ID format: {artifact_id}")

        try:
            db = get_mongodb_client()
            if db.db is None:
                raise InternalServerError("MongoDB not initialized")
            # Find the latest processed update for this artifact
            update = db.db.artifact_updates.find_one(
                {"artifactId": artifact_id, "status": "processed"},
                sort=[("createdAt", -1)]
            )
            if not update:
                return {"message": "No processed artifact update found", "artifactId": artifact_id}
            updated_item = db.db.artifact_updates.update_one(
                {"_id": update["_id"]},
                {"$set": {"content": content, "updatedAt": datetime.now(timezone.utc)}}
            )
            if updated_item.modified_count == 0:
                raise InternalServerError("Failed to update artifact content")
            return {
                "message": "Content updated successfully",
                "status": "success",
            }                          
        except Exception as e:
            if isinstance(e, BadRequest):
                raise
            raise InternalServerError(f"Failed to process session: {str(e)}")
    
    def get_artifact_file_by_id(self, artifact_id):
        """
        Returns the file path, mime type, and filename for the artifact.
        """
        logger.error(f"Entered get_artifact_file_by_id for artifact_id: {artifact_id}")
        try:
            artifact_object_id = parse_artifact_id(artifact_id)
        except Exception as e:
            raise BadRequest(f"Invalid artifact ID format: {artifact_id}")

        db = get_mongodb_client()
        artifact = db.db.artifacts.find_one({"_id": artifact_object_id})
        if not artifact:
            # Try to find in testCollection (sessions)
            artifact, session = find_artifact_in_sessions(artifact_id)
            if not artifact:
                raise NotFound(f"Artifact with ID {artifact_id} not found.")
        # Build the absolute file path
        url = artifact.get("url")
        if not url:
            raise NotFound("Artifact file URL not found.")
        # Use the same logic as in upload to build the file path
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        # Remove leading '/storage' from url and join with project_root/storage
        url_parts = url.lstrip("/").split("/")
        if url_parts[0] == "storage":
            url_parts = url_parts[1:]
        file_path = os.path.join(project_root, "storage", *url_parts)
        logger.error(f"Checking for file at: {file_path}")  # Debug log
        if not os.path.exists(file_path):
            raise NotFound("Artifact file not found on server.")
        # Guess mime type based on extension
        ext = os.path.splitext(file_path)[1].lower()
        if ext in [".wav"]:
            mime_type = "audio/wav"
        elif ext in [".mp3"]:
            mime_type = "audio/mpeg"
        elif ext in [".png"]:
            mime_type = "image/png"
        elif ext in [".jpg", ".jpeg"]:
            mime_type = "image/jpeg"
        else:
            mime_type = "application/octet-stream"
        filename = os.path.basename(file_path)
        return file_path, mime_type, filename

    def create_document_artifact(self, capture_name, content, session_id=None, capture_type='document'):
        """Create a new document artifact (rich text, etc)."""
        db = get_mongodb_client()
        artifact_data = {
            "captureType": capture_type,
            "captureName": capture_name,
            "content": content,
            "captureDate": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        if session_id:
            try:
                artifact_data["sessionId"] = ObjectId(session_id)
            except Exception:
                artifact_data["sessionId"] = session_id
        inserted = db.db.artifacts.insert_one(artifact_data)
        return {
            "message": "Document artifact created",
            "artifactId": str(inserted.inserted_id),
            "captureName": capture_name,
            "captureType": capture_type
        }

    def get_artifacts_by_session_id(self, session_id):
        from pogoapi.utils.mongodb_client import get_mongodb_client
        from bson import ObjectId
        db = get_mongodb_client()
        try:
            session = db.db.testCollection.find_one({'_id': session_id})
            if not session:
                session = db.db.testCollection.find_one({'_id': ObjectId(session_id)})
            if not session or 'artifacts' not in session:
                return []
            return session['artifacts']
        except Exception as e:
            print(f"Error fetching artifacts for session {session_id}: {e}")
            return []

# Create a singleton instance
artifact_service = ArtifactService()

# Export functions that use the singleton instance
def upload_audio(sessionId: str, file):
    return artifact_service.upload_audio(sessionId, file)

def upload_image(sessionId: str, file):
    return artifact_service.upload_image(sessionId, file)

def list_artifacts(sessionId: str):
    return artifact_service.list_artifacts(sessionId)

def delete_artifact_by_id(artifact_id):
    return artifact_service.delete_artifact_by_id(artifact_id)

def process_artifact_by_id(artifact_id, priority='medium'):
    return artifact_service.process_artifact_by_id(artifact_id, priority)

def update_artifact_content_by_id(artifact_id, content):
    return artifact_service.update_artifact_content_by_id(artifact_id, content)

def get_artifact_file_by_id(artifact_id):
    return artifact_service.get_artifact_file_by_id(artifact_id)

def create_document_artifact(capture_name, content, session_id=None, capture_type='document'):
    """Create a new document artifact (rich text, etc)."""
    from bson import ObjectId
    from datetime import datetime, timezone
    db = get_mongodb_client()
    artifact_data = {
        "captureType": capture_type,
        "captureName": capture_name,
        "content": content,
        "captureDate": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }
    if session_id:
        try:
            artifact_data["sessionId"] = ObjectId(session_id)
        except Exception:
            artifact_data["sessionId"] = session_id
    inserted = db.db.artifacts.insert_one(artifact_data)
    return {
        "message": "Document artifact created",
        "artifactId": str(inserted.inserted_id),
        "captureName": capture_name,
        "captureType": capture_type
    }

def parse_artifact_id(artifact_id):
    # Try ObjectId
    try:
        return ObjectId(artifact_id)
    except Exception:
        pass
    # Try UUID
    try:
        uuid.UUID(artifact_id)
        return artifact_id  # Use as string for UUIDs
    except Exception:
        pass
    raise BadRequest(f"Invalid artifact ID format: {artifact_id}")

def find_artifact_in_sessions(artifact_id):
    db = get_mongodb_client()
    session = db.db.testCollection.find_one({"artifacts._id": artifact_id})
    if not session:
        return None, None
    artifact = next((a for a in session["artifacts"] if a["_id"] == artifact_id), None)
    return artifact, session