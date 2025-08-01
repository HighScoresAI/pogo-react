from pydantic import BaseModel, Field, validator
from bson import ObjectId
from typing import Optional

class ProjectRequest(BaseModel):
    """
    Project creation request model
    """
    name: str
    userId: str
    organizationId: Optional[str] = None
    description: Optional[str] = None

    @validator('userId', 'organizationId')
    def validate_object_id(cls, v):
        if v is not None:
            try:
                ObjectId(v)
            except:
                raise ValueError(f"Invalid ObjectId format: {v}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "My Project",
                "userId": "507f1f77bcf86cd799439012",
                "organizationId": "507f1f77bcf86cd799439011"
            }
        }
