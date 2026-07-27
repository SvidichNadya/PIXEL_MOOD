from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

# ----- Базовые схемы для аутентификации -----

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=32, description="Уникальное имя пользователя")
    display_name: Optional[str] = Field(None, max_length=64, description="Отображаемое имя (если не указано, используется username)")
    email: Optional[EmailStr] = Field(None, description="Email (опционально, но уникален)")
    avatar_url: Optional[str] = Field(None, description="URL аватара")

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r'^[a-zA-Z0-9_\-]+$', v):
            raise ValueError('Username must contain only letters, digits, underscores and hyphens')
        return v


class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=64, description="Пароль")
    consent_to_reveal: bool = Field(True, description="Согласие на платное раскрытие авторства")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: str  # ISO datetime string


class TokenData(BaseModel):
    user_id: str
    username: str


# ----- Схемы для социальной аутентификации -----

class VKAuth(BaseModel):
    vk_access_token: str = Field(..., description="VK access token (полученный на фронтенде)")


class TGAuth(BaseModel):
    init_data: str = Field(..., description="Telegram WebApp initData string")


# ----- Схемы для ответов о пользователе -----

class UserOut(BaseModel):
    id: UUID
    username: str
    display_name: str
    email: Optional[str]
    avatar_url: Optional[str]
    is_anonymous_by_default: bool
    allow_paid_reveal: bool
    consent_to_reveal_given_at: Optional[datetime]
    created_at: datetime
    onboarding_completed: bool

    class Config:
        from_attributes = True  # позволяет работать с SQLAlchemy-моделью