from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    link: Optional[str] = None

class NotificationOut(NotificationBase):
    id: UUID
    user_id: UUID
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True