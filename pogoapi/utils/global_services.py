import logging
from typing import Optional
from openai import OpenAI
from pogoapi.utils.mongodb_client import MongoDBClient
# from pogoapi.services.documentation_service import DocumentationService
from pogoapi.services.audio_service import AudioService
from pogoapi.services.image_service import ImageService
from pogoapi.services.artifact_chain_service import ArtifactChainService
from pogoapi.services.vectorization_service import VectorizationService
from pogoapi.utils.path_utils import PathBuilder
from pogoapi.utils.image_utils import ImageProcessor
from pogoapi.services.llm_processor import LLMProcessor

# Global service instances
mongodb_client: Optional[MongoDBClient] = None
openai_client: Optional[OpenAI] = None
# documentation_service: Optional[DocumentationService] = None
audio_service: Optional[AudioService] = None
image_service: Optional[ImageService] = None
chain_service: Optional[ArtifactChainService] = None
vectorization_service: Optional[VectorizationService] = None
path_builder: Optional[PathBuilder] = None
image_processor: Optional[ImageProcessor] = None
llm_processor: Optional[LLMProcessor] = None

def get_llm_processor() -> LLMProcessor:
    """Get LLM processor instance"""
    global llm_processor
    if llm_processor is None:
        llm_processor = LLMProcessor()
    return llm_processor 