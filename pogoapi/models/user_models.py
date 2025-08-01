from pydantic import BaseModel, EmailStr, Field, validator, constr, root_validator
from typing import Optional, Annotated
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

phone_regex = r'^\+?[1-9]\d{1,14}$'

class SignupRequest(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    provider: str = Field(default="local", pattern="^(local|google)$")
    password: Optional[str] = Field(None, min_length=8)
    acceptTerms: Optional[bool] = Field(True, description="User must accept terms and conditions to sign up")

    @validator("password")
    def password_strength(cls, v):
        if v is not None:
            if not any(c.isupper() for c in v):
                raise ValueError("Password must contain at least one uppercase letter")
            if not any(c.islower() for c in v):
                raise ValueError("Password must contain at least one lowercase letter")
            if not any(c.isdigit() for c in v):
                raise ValueError("Password must contain at least one number")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasscodeLoginRequest(BaseModel):
    email: EmailStr
    passcode: str = Field(..., min_length=6, max_length=6, description="6-digit passcode")

class SendPasscodeRequest(BaseModel):
    email: EmailStr

class UserRequest(BaseModel):
    userId: EmailStr
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    provider: str = Field(default="local", pattern="^(local|google)$")
    twoFAEnabled: bool = False
    twoFASecret: Optional[str] = None
    
    @root_validator(pre=True)
    def split_name(cls, values):
        if "name" in values and ("firstName" not in values or "lastName" not in values):
            name_parts = values["name"].strip().split()
            values["firstName"] = name_parts[0]
            values["lastName"] = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        return values
    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user@example.com",
                "firstName": "John",
                "lastName": "Doe",
                "provider": "local"
            }
        }

class UserProfileRequest(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    jobTitle: str = Field(..., min_length=1, max_length=100)
    organization: str = Field(..., min_length=1, max_length=100)
    phone: Annotated[Optional[str], Field(pattern=phone_regex)] = ""
    location: str = Field(..., min_length=1, max_length=100)
    bio: str = Field(..., min_length=1, max_length=300)
    
    class Config:
        json_schema_extra = {
            "example": {
                "firstName": "John",
                "lastName": "Doe",
                "email": "user@example.com",
                "jobTitle": "Software Engineer",
                "organization": "Tech Corp",
                "phone": "+1234567890", 
                "location": "New York, USA",
                "bio": "Experienced software engineer with a passion for building scalable applications."
            }
        }

class PasswordResetTokenSchema(BaseModel):
    userId: EmailStr = Field(..., description="Email of the user the token is associated with")
    token: str = Field(..., description="Unique password reset token")
    expiresAt: datetime = Field(..., description="Token expiration time")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user@example.com",
                "token": "d41d8cd98f00b204e9800998ecf8427e",
                "expiresAt": "2025-06-14T12:00:00Z"
            }
        }

class PasswordResetRequest(BaseModel):
    token: str = Field(..., description="Reset token received by email")
    newPassword: str = Field(..., min_length=8, description="New password")

    class Config:
        json_schema_extra = {
            "example": {
                "token": "d41d8cd98f00b204e9800998ecf8427e",
                "newPassword": "NewStrongPass123!"
            }
        }
