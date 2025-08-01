import os
from typing import Dict, Any, Optional, List
from openai import OpenAI
from pogoapi.utils.mongodb_client import MongoDBClient
from pogoapi.services.image_service import ImageService
from pogoapi.services.audio_service import AudioService
# from pogoapi.services.documentation_service import DocumentationService
from pogoapi.services.vectorization_service import VectorizationService
import logging
from pogoapi.config import config
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ArtifactChainService:
    def __init__(self, openai_client: OpenAI, db_client: MongoDBClient):
        logger.info("Initializing ArtifactChainService")
        self.db = db_client
        self.openai_client = openai_client
        self.llm_config = config.get_llm_config()
        self.model = self.llm_config["models"][config.get_llm_provider()]["text_processing"]
        self.max_tokens = self.llm_config["models"][config.get_llm_provider()]["max_tokens"]
        self.temperature = self.llm_config["models"][config.get_llm_provider()]["temperature"]
        
        # Initialize specialized services
        logger.info("Initializing specialized services")
        self.image_service = ImageService(openai_client=self.openai_client, db_client=self.db)
        self.audio_service = AudioService(openai_client=self.openai_client, db_client=self.db)
        # self.documentation_service = DocumentationService(openai_client=self.openai_client, db_client=self.db)
        logger.info("All services initialized successfully")

    def process_artifact(self, artifact_data: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process an artifact using the appropriate service based on its type."""
        try:
            capture_type = metadata.get("captureType")
            if capture_type == "audio":
                return self.audio_service.process_audio(artifact_data, metadata)
            elif capture_type in ("image", "screenshot"):
                return self.image_service.process_image(artifact_data, metadata)
            else:
                raise ValueError(f"Unsupported artifact type: {capture_type}")
        except Exception as e:
            logger.error(f"Error processing artifact {metadata.get('_id')}: {str(e)}")
            raise

    def process_session_artifacts(self, session_id: str) -> None:
        """Process all artifacts for a given session."""
        try:
            # Import here to avoid circular imports
            from pogoapi.utils.global_services import vectorization_service
            
            # Get all artifacts for the session
            artifacts = self.db.db["artifacts"].find({"sessionId": session_id})
            
            for artifact in artifacts:
                try:
                    # Get artifact data
                    artifact_id = str(artifact["_id"])
                    capture_type = artifact.get("captureType")
                    
                    if capture_type == "audio":
                        # Read audio file
                        audio_path = vectorization_service.path_builder.get_artifact_path(artifact_id)
                        with open(audio_path, 'r', encoding='utf-8') as f:
                            audio_data = f.read()
                            
                        # Process audio
                        self.audio_service.process_audio(audio_data, {
                            "artifact_id": artifact_id,
                            "session_id": session_id,
                            "captureType": "audio"
                        })
                        
                    elif capture_type == "image":
                        # Read image file
                        image_path = vectorization_service.path_builder.get_artifact_path(artifact_id)
                        with open(image_path, 'rb') as f:
                            image_data = base64.b64encode(f.read()).decode('utf-8')
                            
                        # Process image
                        self.image_service.process_image(image_data, {
                            "artifact_id": artifact_id,
                            "session_id": session_id,
                            "captureType": "image"
                        })
                        
                except Exception as e:
                    logger.error(f"Error processing artifact {artifact_id}: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error processing session artifacts: {str(e)}")
            raise 