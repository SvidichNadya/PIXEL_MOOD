import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Enum, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    mood_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("moods.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    type: Mapped[str] = mapped_column(
        Enum('donate', 'reveal', name='payment_type_enum'),
        nullable=False
    )

    amount: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[str] = mapped_column(
        Enum('pending', 'success', 'failed', name='payment_status_enum'),
        nullable=False,
        default='pending',
        index=True
    )

    external_payment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="payments")
    mood: Mapped[Optional["Mood"]] = relationship("Mood", foreign_keys=[mood_id])