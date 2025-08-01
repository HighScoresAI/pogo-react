"""
Artifact update model for storing artifact updates
"""

from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ArtifactUpdate(BaseModel):
    """Artifact update model class"""
    artifact_id: str = Field(..., min_length=24, max_length=24)
    session_id: str = Field(..., min_length=24, max_length=24)
    update_type: str
    content: str
    file_path: str
    model: str = Field(default="gpt-4")
    tokens_used: int = Field(default=0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert artifact update to dictionary"""
        return {
            "artifact_id": self.artifact_id,
            "session_id": self.session_id,
            "update_type": self.update_type,
            "content": self.content,
            "file_path": self.file_path,
            "model": self.model,
            "tokens_used": self.tokens_used,
            "timestamp": self.timestamp,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ArtifactUpdate':
        """Create artifact update from dictionary"""
        return cls(
            artifact_id=data["artifact_id"],
            session_id=data["session_id"],
            update_type=data["update_type"],
            content=data["content"],
            file_path=data["file_path"],
            model=data.get("model", "gpt-4"),
            tokens_used=data.get("tokens_used", 0),
            timestamp=data.get("timestamp", datetime.utcnow()),
            metadata=data.get("metadata", {})
        ) 