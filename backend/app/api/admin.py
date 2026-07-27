from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.api.deps import get_current_admin
from app.models.user import User
from app.models.support import SupportRequest
from app.models.notification import Notification

router = APIRouter(prefix="/admin", tags=["admin"])

# Схемы для ответа
class SupportRequestOut(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    username: Optional[str]
    email: Optional[str]
    message: str
    created_at: datetime
    resolved: bool
    resolved_at: Optional[datetime]
    admin_response: Optional[str]

    class Config:
        from_attributes = True

class SupportRequestDetailOut(SupportRequestOut):
    pass

class ResolveRequest(BaseModel):
    response_message: str

@router.get("/support-requests", response_model=List[SupportRequestOut])
async def list_support_requests(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
    resolved: Optional[bool] = Query(None, description="Фильтр по статусу"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    stmt = select(SupportRequest).order_by(SupportRequest.created_at.desc())
    if resolved is not None:
        stmt = stmt.where(SupportRequest.resolved == resolved)
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/support-requests/{request_id}", response_model=SupportRequestDetailOut)
async def get_support_request_detail(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(SupportRequest).where(SupportRequest.id == request_id)
    result = await db.execute(stmt)
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    return request

@router.post("/support-requests/{request_id}/resolve")
async def resolve_support_request(
    request_id: UUID,
    payload: ResolveRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(SupportRequest).where(SupportRequest.id == request_id)
    result = await db.execute(stmt)
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    if request.resolved:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Request already resolved")

    # Обновляем заявку
    request.resolved = True
    request.resolved_at = datetime.utcnow()
    request.admin_response = payload.response_message
    await db.commit()

    # Отправляем уведомление пользователю (если есть user_id)
    if request.user_id:
        notification = Notification(
            user_id=request.user_id,
            type='support',
            title='Ответ от поддержки',
            message=payload.response_message,
            link='/support'
        )
        db.add(notification)
        await db.commit()

    return {"detail": "Request resolved and notification sent"}