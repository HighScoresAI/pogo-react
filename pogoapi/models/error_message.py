"""
Error message model for storing error data
"""

from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ErrorMessage(BaseModel):
    """Error message model class"""
    artifact_id: str = Field(..., min_length=24, max_length=24)
    session_id: str = Field(..., min_length=24, max_length=24)
    error: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert error message to dictionary"""
        return {
            "artifact_id": self.artifact_id,
            "session_id": self.session_id,
            "error": self.error,
            "timestamp": self.timestamp,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ErrorMessage':
        """Create error message from dictionary"""
        return cls(
            artifact_id=data["artifact_id"],
            session_id=data["session_id"],
            error=data["error"],
            timestamp=data.get("timestamp", datetime.utcnow()),
            metadata=data.get("metadata", {})
        ) 