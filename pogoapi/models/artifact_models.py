from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

class ArtifactBase(BaseModel):
    sessionId: str = Field(..., min_length=24, max_length=24)
    captureType: str = Field(..., pattern="^(audio|image)$")
    captureName: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=1)
    captureDate: datetime

    @validator('sessionId')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v

class ArtifactCreate(ArtifactBase):
    pass

class ArtifactUpdate(BaseModel):
    processedText: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(pending|processing|completed|failed)$")
    processedAt: Optional[datetime] = None

class ArtifactResponse(ArtifactBase):
    id: str = Field(..., min_length=24, max_length=24)
    processedText: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(pending|processing|completed|failed)$")
    processedAt: Optional[datetime] = None

    @validator('id')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v

    class Config:
        from_attributes = True

class ArtifactUpdateRecord(BaseModel):
    artifactId: str = Field(..., min_length=24, max_length=24)
    status: str = Field(..., pattern="^(pending|processing|completed|failed)$")
    processedText: str
    processedAt: datetime

    @validator('artifactId')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v

class SessionArtifactsResponse(BaseModel):
    artifacts: List[ArtifactResponse]
    sessionId: str = Field(..., min_length=24, max_length=24)

    @validator('sessionId')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v
