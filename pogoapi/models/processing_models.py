from pydantic import BaseModel, Field, validator
from bson import ObjectId

class ProcessSessionRequest(BaseModel):
    sessionId: str = Field(..., min_length=24, max_length=24)

    @validator('sessionId')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v

class ProcessArtifactRequest(BaseModel):
    artifactId: str = Field(..., min_length=24, max_length=24)

    @validator('artifactId')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v
