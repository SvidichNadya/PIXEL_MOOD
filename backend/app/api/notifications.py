from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from uuid import UUID
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[NotificationOut])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = False
):
    stmt = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        stmt = stmt.where(Notification.read == False)
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(func.count()).select_from(Notification).where(
        Notification.user_id == current_user.id,
        Notification.read == False
    )
    result = await db.execute(stmt)
    return {"count": result.scalar()}

@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    notification.read = True
    await db.commit()
    return {"detail": "ok"}

@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = update(Notification).where(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).values(read=True)
    await db.execute(stmt)
    await db.commit()
    return {"detail": "ok"}