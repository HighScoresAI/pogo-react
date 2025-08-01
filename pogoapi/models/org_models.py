from pydantic import BaseModel, Field, validator
from bson import ObjectId

class OrganizationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    desc: str
    createdBy: str = Field(..., min_length=24, max_length=24)

    @validator('createdBy')
    def validate_object_id(cls, v):
        try:
            ObjectId(v)
        except:
            raise ValueError(f"Invalid ObjectId format: {v}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "My Organization",
                "description": "My Description",
                "createdBy": "6846c6d101ae6950a2e082b7"
            }
        }
