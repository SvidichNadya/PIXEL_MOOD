import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    vk_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, unique=True)
    tg_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, unique=True)
    display_name: Mapped[str] = mapped_column(String(64), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    is_anonymous_by_default: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_paid_reveal: Mapped[bool] = mapped_column(Boolean, default=True)
    consent_to_reveal_given_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # НОВОЕ: флаг завершения онбординга
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Отношения
    owned_calendars: Mapped[List["Calendar"]] = relationship(
        "Calendar", foreign_keys="Calendar.owner_id", back_populates="owner"
    )
    moods: Mapped[List["Mood"]] = relationship("Mood", back_populates="user")
    reactions: Mapped[List["Reaction"]] = relationship("Reaction", back_populates="user")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
    support_requests: Mapped[List["SupportRequest"]] = relationship("SupportRequest", back_populates="user")