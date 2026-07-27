import uuid
from datetime import date, datetime
from typing import Dict, Optional
from sqlalchemy import Date, DateTime, JSON, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class DailyStat(Base):
    __tablename__ = "daily_stats"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    stat_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    total_pixels: Mapped[int] = mapped_column(nullable=False, default=0)
    color_distribution: Mapped[Dict[str, int]] = mapped_column(JSON, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )