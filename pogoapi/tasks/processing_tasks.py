from pogoapi.celery_app import celery_app
import logging
from celery import shared_task
from pogoapi.services.artifact_service import get_artifact_file_by_id
import os
from openai import OpenAI
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.services.image_service import ImageService
from pogoapi.services.audio_service import AudioService
from werkzeug.exceptions import NotFound, BadRequest

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
db_client = get_mongodb_client()
image_service = ImageService(openai_client=openai_client, db_client=db_client)
audio_service = AudioService(openai_client=openai_client, db_client=db_client)

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def process_audio(self, artifact_id, session_id, priority):
    logger.info(f"Processing audio: artifact_id={artifact_id}, session_id={session_id}, priority={priority}")
    try:
        # Handle the case where get_artifact_file_by_id might raise an exception
        try:
            file_path, mime_type, filename = get_artifact_file_by_id(artifact_id)
        except (NotFound, BadRequest) as e:
            logger.error(f"Artifact file not found or invalid for {artifact_id}: {e}")
            return {"status": "error", "type": "audio", "artifact_id": artifact_id, "error": f"Artifact file not found: {str(e)}"}
        
        metadata = {
            "_id": artifact_id,
            "sessionId": session_id,
            "priority": priority,
        }
        result = audio_service.process_audio(file_path, metadata)
        return result
    except Exception as e:
        logger.error(f"Failed to process audio artifact {artifact_id}: {e}")
        return {"status": "error", "type": "audio", "artifact_id": artifact_id, "error": str(e)}

@shared_task(bind=True)
def process_image(self, artifact_id, session_id, priority):
    logger.error(f"Celery process_image called for artifact_id: {artifact_id}, session_id: {session_id}, priority: {priority}")
    logger.info(f"Processing image: artifact_id={artifact_id}, session_id={session_id}, priority={priority}")
    try:
        # Handle the case where get_artifact_file_by_id might raise an exception
        try:
            file_path, mime_type, filename = get_artifact_file_by_id(artifact_id)
        except (NotFound, BadRequest) as e:
            logger.error(f"Artifact file not found or invalid for {artifact_id}: {e}")
            return {"status": "error", "type": "image", "artifact_id": artifact_id, "error": f"Artifact file not found: {str(e)}"}
        
        metadata = {
            "_id": artifact_id,
            "sessionId": session_id,
            "priority": priority
        }
        result = image_service.process_image(file_path, metadata)
        return result
    except Exception as e:
        logger.error(f"Failed to process image artifact {artifact_id}: {e}")
        return {"status": "error", "type": "image", "artifact_id": artifact_id, "error": str(e)}

@shared_task(bind=True)
def process_session(self, session_id, priority):
    logger.info(f"Processing session: session_id={session_id}, priority={priority}")
    # TODO: Implement session processing logic
    return {"status": "processed", "type": "session", "session_id": session_id} 