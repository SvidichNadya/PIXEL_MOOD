# ========== ЭТАП 1: СБОРКА ФРОНТЕНДА ==========
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Настройка npm для стабильной загрузки
RUN npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-timeout 600000
RUN npm config set fetch-retries 5

# Копируем package.json и устанавливаем зависимости
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Копируем исходники фронтенда
COPY frontend/ ./

# Передаём переменную окружения для API
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE

# Собираем фронтенд
RUN npm run build


# ========== ЭТАП 2: ФИНАЛЬНЫЙ ОБРАЗ ==========
FROM python:3.11-slim

WORKDIR /app

# Устанавливаем системные зависимости (nginx, gcc для psycopg2)
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

# Копируем собранный фронтенд в папку nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем entrypoint и делаем его исполняемым
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Открываем порт 80
EXPOSE 80

# Запускаем entrypoint
ENTRYPOINT ["/entrypoint.sh"]