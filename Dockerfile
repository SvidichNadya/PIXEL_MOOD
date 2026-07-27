# Используем официальный образ Python
FROM python:3.11-slim

# Устанавливаем системные зависимости (включая postgresql-client для pg_isready)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем backend и frontend
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем скрипты запуска
COPY build.sh start.sh /app/
RUN chmod +x /app/build.sh /app/start.sh

# Устанавливаем Python-зависимости (build-стадия)
RUN cd /app/backend && pip install --no-cache-dir -r requirements.txt

# Собираем фронтенд (если нужно, но предположим, что он уже собран)
# Если фронтенд собирается отдельно, то просто копируем сборку
# Для примера скопируем готовую сборку из папки frontend/dist
COPY frontend/dist /usr/share/nginx/html

# Открываем порт 8000 для бекенда (nginx слушает 80)
EXPOSE 8000 80

# Запускаем start.sh
CMD ["/app/start.sh"]