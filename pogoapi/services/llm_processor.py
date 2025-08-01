"""
LLM Processor service for handling LLM operations
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from openai import OpenAI
from pogoapi.utils.llm_processor_utils import LLMProcessorUtils as LLMProcessorUtil
from pogoapi.utils.mongodb_client import get_mongodb_client
from pogoapi.config import config

# Configure logger
logger = logging.getLogger(__name__)

class LLMProcessor:
    """Service for handling LLM operations"""
    _instance = None
    _initialized = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(LLMProcessor, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._initialize()
            self._initialized = True

    def _initialize(self):
        """Initialize the LLM processor"""
        try:
            # Get configuration
            self.llm_config = config.get_llm_config()
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable is not set")
            
            # Initialize MongoDB client
            self.db_client = get_mongodb_client()
            
            # Initialize utility class
            self.processor = LLMProcessorUtil(api_key, self.db_client)
            
            logger.info("LLMProcessor initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize LLMProcessor: {str(e)}")
            raise

    def process_audio(self, audio_path: str, artifact_id: str) -> Optional[str]:
        """Process audio file"""
        try:
            return self.processor.process_audio(audio_path, artifact_id)
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            return None

    def process_image(self, image_path: str, artifact_id: str, audio_context: str = "") -> Optional[str]:
        """Process image file"""
        try:
            return self.processor.process_image(image_path, artifact_id, audio_context)
        except Exception as e:
            logger.error(f"3 Error processing image: {str(e)}")
            return None

    def process_session(self, session_id: str) -> Optional[str]:
        """Process a session"""
        try:
            return self.processor.process_session(session_id)
        except Exception as e:
            logger.error(f"Error processing session: {str(e)}")
            return None

    def generate_response(self, message: str, context: str = "", project_id: str = "") -> str:
        """Generate a response to a user message"""
        try:
            return self.processor.generate_response(message, context, project_id)
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I'm sorry, I encountered an error while generating a response. Please try again." 