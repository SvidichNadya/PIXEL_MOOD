import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import UUID

from app.config import settings


def hash_password(password: str) -> str:
    """
    Хеширует пароль с использованием bcrypt.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет пароль на соответствие хешу.
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def create_access_token(
    user_id: UUID,
    username: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Создаёт JWT-токен доступа.
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return token


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Декодирует и проверяет JWT-токен.
    Возвращает payload или None, если токен невалиден.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.PyJWTError:
        return None


def get_user_id_from_token(token: str) -> Optional[UUID]:
    """
    Извлекает user_id из токена.
    """
    payload = decode_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    try:
        return UUID(user_id)
    except ValueError:
        return None


def get_username_from_token(token: str) -> Optional[str]:
    """
    Извлекает username из токена.
    """
    payload = decode_token(token)
    if not payload:
        return None
    return payload.get("username")


def is_token_expired(token: str) -> bool:
    """
    Проверяет, истёк ли срок действия токена.
    """
    payload = decode_token(token)
    if not payload:
        return True
    exp = payload.get("exp")
    if not exp:
        return True
    return datetime.utcnow() > datetime.fromtimestamp(exp)