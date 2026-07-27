from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

class MoodBase(BaseModel):
    color: str = Field(..., description="HEX-код цвета")
    message: Optional[str] = None
    is_anonymous: bool = False

class MoodCreate(MoodBase):
    date: Optional[str] = None
    calendar_id: Optional[UUID] = None
    position: Optional[int] = None  # НОВОЕ

class MoodUpdate(BaseModel):
    message: Optional[str] = None
    color: Optional[str] = None
    is_anonymous: Optional[bool] = None

class MoodOut(MoodBase):
    id: UUID
    user_id: UUID
    username: Optional[str] = None
    date: datetime
    calendar_id: Optional[UUID] = None
    is_global: bool
    created_at: datetime
    reaction_count: int = 0
    position: Optional[int] = None  # НОВОЕ

    class Config:
        from_attributes = True