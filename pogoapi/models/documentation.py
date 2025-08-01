"""
Documentation model for storing documentation data
"""

from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class Documentation(BaseModel):
    """Documentation model class"""
    artifact_id: str = Field(..., min_length=24, max_length=24)
    session_id: str = Field(..., min_length=24, max_length=24)
    content: str
    file_path: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert documentation to dictionary"""
        return {
            "artifact_id": self.artifact_id,
            "session_id": self.session_id,
            "content": self.content,
            "file_path": self.file_path,
            "timestamp": self.timestamp,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Documentation':
        """Create documentation from dictionary"""
        return cls(
            artifact_id=data["artifact_id"],
            session_id=data["session_id"],
            content=data["content"],
            file_path=data["file_path"],
            timestamp=data.get("timestamp", datetime.utcnow()),
            metadata=data.get("metadata", {})
        ) 