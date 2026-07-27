import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class SupportRequest(Base):
    __tablename__ = "support_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    admin_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="support_requests")