import os
import yaml
from typing import Dict, Any, Optional
from pathlib import Path

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional

class Config:
    _instance = None
    _config = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._instance._load_config()
        return cls._instance

    def _load_config(self):
        """Load configuration from config.yaml"""
        config_path = Path(__file__).parent / 'config.yaml'
        try:
            with open(config_path, 'r') as f:
                self._config = yaml.safe_load(f)
        except Exception as e:
            raise Exception(f"Failed to load config.yaml: {str(e)}")

    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value by key"""
        if self._config is None:
            self._load_config()
        
        # Handle nested keys with dot notation
        keys = key.split('.')
        value = self._config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k, default)
            else:
                return default
        return value

    def get_mongodb_url(self) -> str:
        """Get MongoDB connection URL"""
        return self.get('MONGODB_URL')

    def get_database_name(self) -> str:
        """Get database name"""
        return self.get('DATABASE_NAME')

    def get_llm_config(self) -> Dict[str, Any]:
        """Get LLM configuration"""
        return self.get('llm', {})

    def get_llm_provider(self) -> str:
        """Get LLM provider"""
        return self.get('llm.provider', 'openai')

    def get_llm_models(self, provider: Optional[str] = None) -> Dict[str, str]:
        """Get LLM models configuration"""
        provider = provider or self.get_llm_provider()
        return self.get(f'llm.models.{provider}', {})

    def get_llm_processing_settings(self) -> Dict[str, Any]:
        """Get LLM processing settings"""
        return self.get('llm.processing', {})

    def get_test_ids(self) -> Dict[str, str]:
        """Get test IDs"""
        return {
            'user_id': self.get('TEST_USER_ID'),
            'project_id': self.get('TEST_PROJECT_ID'),
            'session_id': self.get('TEST_SESSION_ID')
        }

    def get_audio_chunk_size(self) -> int:
        """Get audio chunk size"""
        return self.get('AUDIO_CHUNK_SIZE', 1024)

    def get_image_max_size(self) -> tuple:
        """Get maximum image dimensions"""
        return self.get('IMAGE_MAX_SIZ', (1920, 1080))

    def get_firebase_config(self) -> Dict[str, Any]:
        """Get Firebase configuration"""
        return self.get('firebase', {})

    def get_jwt_config(self) -> Dict[str, Any]:
        """Get JWT configuration"""
        return self.get('jwt', {})

    def get_jwt_secret_key(self) -> str:
        """Get JWT secret key"""
        return os.getenv('JWT_SECRET_KEY', self.get('jwt.secret_key', 'your-secret-key-change-in-production'))

    def get_jwt_expiration_hours(self) -> int:
        """Get JWT expiration hours"""
        return self.get('jwt.expiration_hours', 24)

# Elasticsearch configuration
ELASTICSEARCH_URL = os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200')
ELASTICSEARCH_USERNAME = os.getenv('ELASTICSEARCH_USERNAME', 'elastic')
ELASTICSEARCH_PASSWORD = os.getenv('ELASTICSEARCH_PASSWORD', 'javfqiflW3qUVPgJQ14N')  # Set to your current elastic password

# Create a singleton instance
config = Config() 