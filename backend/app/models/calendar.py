import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class Calendar(Base):
    __tablename__ = "calendars"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    member_ids: Mapped[List[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        nullable=False,
        default=list
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id], back_populates="owned_calendars")
    moods: Mapped[List["Mood"]] = relationship("Mood", back_populates="calendar", cascade="all, delete-orphan")