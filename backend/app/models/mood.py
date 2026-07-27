import uuid
from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Date, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class Mood(Base):
    __tablename__ = "moods"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    color: Mapped[str] = mapped_column(String(7), nullable=False)

    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    calendar_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("calendars.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    is_global: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # НОВОЕ: позиция в сетке (индекс ячейки)
    position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="moods")
    calendar: Mapped[Optional["Calendar"]] = relationship("Calendar", back_populates="moods")
    reactions: Mapped[List["Reaction"]] = relationship("Reaction", back_populates="mood", cascade="all, delete-orphan")

    @property
    def username(self) -> Optional[str]:
        if self.user:
            return self.user.display_name or self.user.username
        return None