from uuid import UUID
from pydantic import BaseModel
from datetime import datetime

class ReactionBase(BaseModel):
    type: str  # например, "like", "heart", "laugh"

class ReactionCreate(ReactionBase):
    pass

class ReactionOut(ReactionBase):
    id: UUID
    mood_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True