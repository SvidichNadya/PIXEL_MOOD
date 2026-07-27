import hashlib
import hmac
from typing import Dict, Any, Optional
from urllib.parse import urlparse, parse_qs
from datetime import datetime

from app.config import settings


def validate_telegram_init_data(init_data: str) -> Optional[Dict[str, Any]]:
    """
    Проверяет подпись Telegram WebApp initData и возвращает словарь параметров,
    если данные валидны. Иначе возвращает None.
    """
    if not settings.TG_BOT_SECRET:
        return None  # Telegram не настроен

    # Разбираем строку init_data на параметры
    params = {}
    for pair in init_data.split('&'):
        if '=' in pair:
            key, value = pair.split('=', 1)
            params[key] = value

    # Проверяем наличие hash
    received_hash = params.pop('hash', None)
    if not received_hash:
        return None

    # Сортируем параметры (кроме hash) и формируем строку для проверки
    sorted_params = sorted(params.items())
    data_check_string = '\n'.join([f"{k}={v}" for k, v in sorted_params])

    # Генерируем секретный ключ из токена бота
    secret_key = hashlib.sha256(settings.TG_BOT_SECRET.encode()).digest()

    # Вычисляем HMAC-SHA256
    computed_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    # Сравниваем с полученным
    if computed_hash != received_hash:
        return None

    # Проверяем время авторизации (не старше 1 дня)
    auth_date = int(params.get('auth_date', 0))
    if datetime.utcnow().timestamp() - auth_date > 86400:
        return None

    # Возвращаем параметры (без hash)
    return params


def get_telegram_user_data(init_data: str) -> Optional[Dict[str, Any]]:
    """
    Извлекает данные пользователя из валидной initData.
    Возвращает словарь с полями: id, first_name, last_name, username, photo_url (опционально).
    """
    params = validate_telegram_init_data(init_data)
    if not params:
        return None

    user_data = {}
    # Извлекаем user из строки, если есть поле user (JSON)
    if 'user' in params:
        try:
            import json
            user = json.loads(params['user'])
            user_data['id'] = str(user.get('id'))
            user_data['first_name'] = user.get('first_name', '')
            user_data['last_name'] = user.get('last_name', '')
            user_data['username'] = user.get('username', '')
            user_data['photo_url'] = user.get('photo_url')
        except (json.JSONDecodeError, AttributeError):
            return None
    else:
        # Если user нет, пробуем отдельные поля (старый формат)
        user_data['id'] = params.get('id')
        user_data['first_name'] = params.get('first_name', '')
        user_data['last_name'] = params.get('last_name', '')
        user_data['username'] = params.get('username', '')
        user_data['photo_url'] = params.get('photo_url')

    if not user_data.get('id'):
        return None

    return user_data