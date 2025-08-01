import os
import json
import logging
import base64
from datetime import datetime
from typing import Dict, Any, Optional
from openai import OpenAI
from pogoapi.utils.mongodb_client import MongoDBClient
from pogoapi.utils.path_utils import PathBuilder
from pogoapi.utils.prompt_loader import PromptLoader
from bson import ObjectId
from pogoapi.config import config

# Configure logging
logger = logging.getLogger(__name__)

class ImageService:
    def __init__(self, openai_client: OpenAI, db_client: MongoDBClient):
        """Initialize ImageService with OpenAI and MongoDB clients"""
        self.openai_client = openai_client
        self.db = db_client
        self.path_builder = PathBuilder(db_client)
        self.prompt_loader = PromptLoader()
        
        # Load LLM configuration
        self.llm_config = config.get_llm_config()
        provider = config.get_llm_provider()
        self.model = self.llm_config["models"][provider]["image_analysis"]
        self.max_tokens = self.llm_config["models"][provider]["max_tokens"]
        self.temperature = self.llm_config["models"][provider]["temperature"]
        
        logging.info("ImageService initialized with OpenAI and MongoDB clients")

    def analyze_image(self, image_data: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze image using OpenAI"""
        try:
            logger.info(f"[ImageService] Starting analyze_image for image_data: {len(image_data)} bytes, metadata: {metadata}")
            # Get image analysis prompt
            prompt = self.prompt_loader.get_prompt("image_analysis")
            
            # Create messages for OpenAI
            messages = [
                {"role": "system", "content": prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        },
                        {
                            "type": "text",
                            "text": f"Please analyze this image. Metadata: {metadata}"
                        }
                    ]
                }
            ]
            
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            # Extract analysis from response
            analysis = response.choices[0].message.content
            logger.info(f"[ImageService] analyze_image successful. Analysis length: {len(analysis)}")
            return {
                "status": "success",
                "analysis": analysis
            }
            
        except Exception as e:
            error_msg = f"Error analyzing image: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }

    def process_image(self, file_path: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process image data"""
        try:
            logger.error(f"[ImageService] Starting process_image for file_path: {file_path}, metadata: {metadata}")
            # Analyze image
            with open(file_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            logger.error(f"[ImageService] Image data loaded, calling analyze_image...")
            analysis_result = self.analyze_image(image_data, metadata)
            logger.error(f"[ImageService] analyze_image result: {analysis_result}")

            if analysis_result["status"] == "error":
                logger.error(f"[ImageService] analyze_image returned error: {analysis_result}")
                return analysis_result

            # Store analysis in MongoDB
            logger.error(f"[ImageService] Storing artifact update for artifact_id: {metadata.get('_id')}, session_id: {metadata.get('sessionId')}")
            self.store_artifact_update(
                artifact_id=metadata.get("_id"),
                session_id=metadata.get("sessionId"),
                status="processed",
                content=analysis_result["analysis"]
            )
            logger.error(f"[ImageService] Artifact update stored successfully.")
            return analysis_result
            
        except Exception as e:
            error_msg = f"2 Error processing image: {str(e)}"
            logger.error(error_msg)
            return {
                "status": "error",
                "error": error_msg
            }

    def store_artifact_update(
        self,
        artifact_id: str,
        session_id: str,
        status: str,
        content: str = "",
        error_message: str = "",
        processor: str = "image"
    ) -> None:
        """Store artifact update in MongoDB"""
        try:
            update_data = {
                "artifactId": artifact_id,
                "sessionId": session_id,
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