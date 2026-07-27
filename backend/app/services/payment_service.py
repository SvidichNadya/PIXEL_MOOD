from typing import Optional
from app.config import settings

class PaymentService:
    @staticmethod
    def is_payments_enabled() -> bool:
        """Проверяет, настроены ли платёжные ключи."""
        return bool(settings.YOOKASSA_SHOP_ID and settings.YOOKASSA_SECRET_KEY)

    @staticmethod
    async def create_donate_payment(amount: int, user_id: str) -> dict:
        """
        Создаёт платёж для доната.
        В реальном проекте здесь будет интеграция с ЮKassa или другой ПС.
        """
        if not PaymentService.is_payments_enabled():
            raise ValueError("Payment service is not configured")

        # Пример ответа (заглушка)
        # В реальности вызов API ЮKassa: возврат ссылки на оплату или id сессии
        return {
            "payment_id": "donate_123",
            "payment_url": f"https://example.com/pay/{user_id}/{amount}",
            "amount": amount
        }

    @staticmethod
    async def create_reveal_payment(mood_id: str, user_id: str) -> dict:
        """
        Создаёт платёж для раскрытия автора пикселя.
        """
        if not PaymentService.is_payments_enabled():
            raise ValueError("Payment service is not configured")

        price = settings.REVEAL_PRICE_RUB
        # Пример ответа (заглушка)
        return {
            "payment_id": f"reveal_{mood_id}",
            "payment_url": f"https://example.com/pay/reveal/{mood_id}",
            "amount": price,
            "currency": "RUB"
        }

    @staticmethod
    async def confirm_payment(payment_id: str, external_data: dict) -> bool:
        """
        Подтверждает платёж (например, по callback от ЮKassa).
        """
        if not PaymentService.is_payments_enabled():
            raise ValueError("Payment service is not configured")

        # Здесь логика проверки статуса платежа
        # Заглушка: всегда успешно
        return True