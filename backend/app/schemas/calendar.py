from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

class CalendarBase(BaseModel):
    name: str
    description: Optional[str] = None

class CalendarCreate(CalendarBase):
    member_ids: List[UUID] = []  # список участников (по умолчанию только владелец)

class CalendarUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    member_ids: Optional[List[UUID]] = None

class CalendarOut(CalendarBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    member_ids: List[UUID]  # для удобства

    class Config:
        from_attributes = True