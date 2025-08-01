from pydantic import BaseModel, Field, validator
from bson import ObjectId
from datetime import datetime
from typing import Optional, List

class SessionRequest(BaseModel):
    projectId: str = Field(..., min_length=24, max_length=24)
    createdBy: str = Field(..., min_length=24, max_length=24)

    @validator('projectId', 'createdBy')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "projectId": "507f1f77bcf86cd799439011",
                "createdBy": "6846c6d101ae6950a2e082b7"
            }
        }

class SessionBase(BaseModel):
    projectId: str = Field(..., min_length=24, max_length=24)
    createdBy: str = Field(..., min_length=24, max_length=24)
    createdAt: datetime

    @validator('projectId', 'createdBy')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    processedText: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|completed|archived)$")
    updatedAt: Optional[datetime] = None

class SessionResponse(SessionBase):
    id: str = Field(..., min_length=24, max_length=24)
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    processedText: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|completed|archived)$")
    updatedAt: Optional[datetime] = None

    @validator('id')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v

    class Config:
        from_attributes = True

class UserSession(BaseModel):
    userId: str
    sessionId: str
    device: Optional[str]
    ip: Optional[str]
    userAgent: Optional[str]
    createdAt: datetime
    lastActive: datetime
    current: Optional[bool] = False
