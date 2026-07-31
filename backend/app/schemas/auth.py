from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    display_name: Optional[str] = Field(None, max_length=64)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r'^[a-zA-Z0-9_\-]+$', v):
            raise ValueError('Username must contain only letters, digits, underscores and hyphens')
        return v

class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=64)
    consent_to_reveal: bool = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    username: str
    display_name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    is_anonymous_by_default: bool
    allow_paid_reveal: bool
    consent_to_reveal_given_at: Optional[datetime] = None
    created_at: datetime
    onboarding_completed: bool
    is_admin: bool = False
    vk_id: Optional[str] = None
    tg_id: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: Optional[str] = None
    user: Optional[UserOut] = None