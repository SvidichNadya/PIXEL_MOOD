# =============================================
# ЭТАП 1: Бекенд (Python + зависимости)
# =============================================
FROM python:3.11-slim AS backend

# Устанавливаем системные пакеты (nginx, postgresql-client)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    nginx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем backend и устанавливаем Python-зависимости
COPY backend/ /app/backend/
RUN cd /app/backend && pip install --no-cache-dir -r requirements.txt

# Копируем конфиг nginx и скрипты запуска
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY build.sh start.sh /app/
RUN chmod +x /app/build.sh /app/start.sh

# =============================================
# ЭТАП 2: Сборка фронтенда (Node.js)
# =============================================
FROM node:18-alpine AS frontend-builder

# Передаём переменную для Vite (можно переопределить при сборке)
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE

WORKDIR /app/frontend

# Копируем package.json и устанавливаем зависимости
COPY frontend/package*.json ./
RUN npm ci

# Копируем исходники и собираем
COPY frontend/ .
RUN npm run build

# =============================================
# ЭТАП 3: Финальный образ (только нужные артефакты)
# =============================================
FROM python:3.11-slim

# Устанавливаем nginx и postgresql-client (для pg_isready)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем бекенд из первого этапа
COPY --from=backend /app/backend /app/backend
COPY --from=backend /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend /usr/local/bin /usr/local/bin

# Копируем конфиг nginx и скрипты
COPY --from=backend /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=backend /app/build.sh /app/start.sh /app/
RUN chmod +x /app/build.sh /app/start.sh

# Копируем собранный фронтенд из второго этапа
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Открываем порты
EXPOSE 8000 80

CMD ["/app/start.sh"]