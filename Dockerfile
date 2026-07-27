# ========== ЭТАП 1: СБОРКА ФРОНТЕНДА ==========
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

RUN npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-timeout 600000
RUN npm config set fetch-retries 5

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./

ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

# ========== ЭТАП 2: ФИНАЛЬНЫЙ ОБРАЗ ==========
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копируем бекенд
COPY backend/ ./backend/

# Устанавливаем Python-зависимости
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем собранный фронтенд
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Копируем конфиг nginx (перезаписывает любой существующий)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем скрипты сборки и запуска
COPY build.sh /build.sh
COPY start.sh /start.sh
RUN chmod +x /build.sh /start.sh

EXPOSE 80

CMD ["/start.sh"]