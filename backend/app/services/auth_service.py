import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional
import httpx
import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth import UserRegister
from app.config import settings

# Используем sha256_crypt вместо bcrypt — не требует внешних библиотек
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_email(self, payload: UserRegister) -> User:
        # Проверка уникальности username
        stmt = select(User).where(User.username == payload.username)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError("Username already exists")

        if payload.email:
            stmt = select(User).where(User.email == payload.email)
            result = await self.db.execute(stmt)
            if result.scalar_one_or_none():
                raise ValueError("Email already exists")

        user = User(
            username=payload.username,
            email=payload.email,
            password_hash=pwd_context.hash(payload.password),
            display_name=payload.display_name or payload.username,
            consent_to_reveal_given_at=datetime.utcnow() if payload.consent_to_reveal else None,
            allow_paid_reveal=payload.consent_to_reveal
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate_email(self, email: str, password: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user or not user.password_hash:
            return None
        if not pwd_context.verify(password, user.password_hash):
            return None
        return user

    async def authenticate_vk(self, vk_access_token: str) -> User:
        if not settings.VK_APP_ID or not settings.VK_SECRET:
            raise ValueError("VK authentication is not configured on this server")

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.vk.com/method/users.get",
                params={
                    "access_token": vk_access_token,
                    "v": "5.131",
                    "fields": "photo_50"
                }
            )
            data = resp.json()
            if "error" in data:
                raise ValueError("Invalid VK token")
            vk_user = data["response"][0]
            vk_id = str(vk_user["id"])

        stmt = select(User).where(User.vk_id == vk_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                username=f"vk_{vk_id}",
                vk_id=vk_id,
                display_name=vk_user.get("first_name", "") + " " + vk_user.get("last_name", ""),
                avatar_url=vk_user.get("photo_50"),
                consent_to_reveal_given_at=datetime.utcnow(),
                allow_paid_reveal=True
            )
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)

        return user

    async def authenticate_telegram(self, init_data: str) -> User:
        if not settings.TG_BOT_SECRET:
            raise ValueError("Telegram authentication is not configured on this server")

        params = dict(pair.split("=") for pair in init_data.split("&"))
        received_hash = params.pop("hash", None)
        if not received_hash:
            raise ValueError("Missing hash")

        sorted_params = sorted(params.items())
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted_params)

        secret_key = hashlib.sha256(settings.TG_BOT_SECRET.encode()).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if computed_hash != received_hash:
            raise ValueError("Invalid init data")

        tg_id = params.get("id")
        if not tg_id:
            raise ValueError("Missing user id")

        auth_date = int(params.get("auth_date", 0))
        if datetime.utcnow().timestamp() - auth_date > 86400:
            raise ValueError("Auth data expired")

        stmt = select(User).where(User.tg_id == tg_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            first_name = params.get("first_name", "")
            last_name = params.get("last_name", "")
            username = params.get("username", f"tg_{tg_id}")
            user = User(
                username=username,
                tg_id=tg_id,
                display_name=f"{first_name} {last_name}".strip() or username,
                avatar_url=params.get("photo_url"),
                consent_to_reveal_given_at=datetime.utcnow(),
                allow_paid_reveal=True
            )
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)

        return user

    def create_token(self, user: User) -> dict:
        expires = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user.id),
            "exp": expires,
            "username": user.username
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_at": expires.isoformat()
        }

    @staticmethod
    def hash_password(password: str) -> str:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
        return pwd_context.hash(password)