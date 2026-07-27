from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.mood import Mood
from app.schemas.payment import DonateRequest, RevealRequest, PaymentResponse, PaymentWebhook
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/donate", response_model=PaymentResponse)
async def create_donate_payment(
    payload: DonateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать платёж для доната."""
    try:
        result = await PaymentService.create_donate_payment(payload.amount, str(current_user.id))
        return result
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

@router.post("/reveal", response_model=PaymentResponse)
async def create_reveal_payment(
    payload: RevealRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать платёж для раскрытия автора пикселя."""
    # Проверим, существует ли настроение
    stmt = select(Mood).where(Mood.id == payload.mood_id)
    result = await db.execute(stmt)
    mood = result.scalar_one_or_none()
    if not mood:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mood not found")
    # Проверим, не своё ли настроение (нельзя раскрыть себя)
    if mood.user_id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot reveal your own mood")
    # Проверим, разрешено ли раскрытие
    if not mood.is_anonymous:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This mood is already public")
    # Можно дополнительно проверить, не раскрыто ли уже (если хранить флаг revealed)

    try:
        result = await PaymentService.create_reveal_payment(str(payload.mood_id), str(current_user.id))
        return result
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

@router.post("/webhook")
async def payment_webhook(
    payload: PaymentWebhook,
    db: AsyncSession = Depends(get_db)
):
    """Webhook для подтверждения платежа (вызывается платёжной системой)."""
    try:
        success = await PaymentService.confirm_payment(payload.payment_id, payload.external_data)
        if not success:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment confirmation failed")
        # Здесь можно обновить статус платежа в БД, раскрыть автора, если это reveal и т.д.
        return {"status": "ok"}
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))