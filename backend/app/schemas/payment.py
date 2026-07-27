from uuid import UUID
from pydantic import BaseModel
from typing import Optional

class DonateRequest(BaseModel):
    amount: int

class RevealRequest(BaseModel):
    mood_id: UUID

class PaymentResponse(BaseModel):
    payment_id: str
    payment_url: str
    amount: int
    currency: str = "RUB"

class PaymentWebhook(BaseModel):
    payment_id: str
    status: str  # "success" или "failed"
    external_data: dict  # данные от платёжной системы