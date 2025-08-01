import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from openai import OpenAI
from pymongo.errors import DuplicateKeyError
from pogoapi.utils.mongodb_client import MongoDBClient
from pogoapi.utils.path_utils import PathBuilder
from pogoapi.utils.prompt_loader import PromptLoader
from pogoapi.utils.llm_processor_utils import LLMProcessorUtils
from bson import ObjectId
from pogoapi.config import config
from pyannote.audio import Pipeline

# Configure logging
logger = logging.getLogger(__name__)

def diarize_audio(file_path, hf_token="YOUR_HF_TOKEN_HERE"):
    """Run speaker diarization on the audio file and return segments."""
    pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization", use_auth_token=hf_token)
    diarization = pipeline(file_path)
    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "start": float(turn.start),
            "end": float(turn.end),
            "speaker": speaker
        })
    return segments

class AudioService:
    def __init__(self, openai_client: OpenAI, db_client: MongoDBClient):
        """Initialize AudioService with OpenAI and MongoDB clients"""
        self.openai_client = openai_client
        self.db = db_client
        self.path_builder = PathBuilder(db_client)
        self.prompt_loader = PromptLoader()
        
        # Load LLM configuration
        self.llm_config = config.get_llm_config()
        provider = config.get_llm_provider()
        self.model = self.llm_config["models"][provider]["audio_transcription"]
        self.max_tokens = self.llm_config["models"][provider]["max_tokens"]
        self.temperature = self.llm_config["models"][provider]["temperature"]
        
        logging.info("AudioService initialized with OpenAI and MongoDB clients")

    def transcribe_audio(self, audio_data: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Transcribe audio using OpenAI and perform speaker diarization."""
        try:
            # Get audio transcription prompt
            prompt = self.prompt_loader.get_prompt("audio_transcription")
            
            print(f"Prompt: {prompt}")
            # Create messages for OpenAI
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Audio Data: {audio_data}\nMetadata: {metadata}"}
            ]
            
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Extract transcription from response
            transcription = response.choices[0].message.content
            
            print(f"Transcription: {transcription}")
            
            # Save audio_data to a temp file for diarization
            import tempfile, os
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name
            try:
                # Speaker diarization
                segments = diarize_audio(tmp_path)
            finally:
                os.remove(tmp_path)
            
            return {
                "status": "success",
                "transcription": transcription,
                "segments": segments
            }
            
        except Exception as e:
            error_msg = f"Error transcribing audio: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }

    def process_audio(self, audio_data: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process audio data"""
        try:
            # Check if already processed
            artifact_id = metadata.get("_id")
            print(f"Checking if audio artifact at {artifact_id, audio_data} is already processed")
            if self._is_artifact_processed(artifact_id):
                logger.info(f"Audio artifact {artifact_id} already processed, skipping")
                return None
            
            # Transcribe audio
            transcription_result = LLMProcessorUtils.process_audio(self, audio_data, metadata.get("_id"))
            
            # Store transcription in MongoDB
            self.store_artifact_update(
                artifact_id=metadata.get("_id"),
                session_id=metadata.get("sessionId"),
                status="processed",
                content=transcription_result
            )
            
            return transcription_result
            
        except Exception as e:
            error_msg = f"Error processing audio: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }
        
    def _is_artifact_processed(self, artifact_id: str) -> bool:
        """
        Check if an artifact has already been processed and stored in the database
        
        Args:
            artifact_id: The ID of the artifact to check
            
        Returns:
            bool: True if the artifact has been processed, False otherwise
        """
        try:
            # Get the latest successful update for this artifact (as string)
            latest_update = self.db.db["artifact_updates"].find_one(
                {
                    "artifactId": str(artifact_id),
                    "status": "processed"  # Only consider successful updates
                },
                sort=[("createdAt", -1)]
            )
            return latest_update is not None
        except Exception as e:
            logger.error(f"Error checking artifact processing status: {str(e)}")
            return False
        
    def store_artifact_update(
        self,
        artifact_id: str,
        session_id: str,
        status: str,
        content: str = "",
        error_message: str = "",
        processor: str = "audio"
    ) -> None:
        """Store artifact update in MongoDB"""
        try:
            update_data = {
                "artifactId": str(artifact_id),
                "sessionId": str(session_id),
                "status": status,
                "content": content,
                "errorMessage": error_message,
                "processor": processor,
                "createdAt": datetime.utcnow()
            }
            self.db.db["artifact_updates"].insert_one(update_data)
        except Exception as e:
            logger.error(f"Error storing artifact update: {str(e)}")
            raise 