# ---- Этап сборки зависимостей ----
FROM python:3.11-slim AS builder

WORKDIR /app

# Устанавливаем системные зависимости для компиляции (psycopg2 и др.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копируем и устанавливаем зависимости в виртуальное окружение
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt

# ---- Финальный образ ----
FROM python:3.11-slim

WORKDIR /app

# Копируем виртуальное окружение из builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Копируем исходный код приложения
COPY . .

# Копируем entrypoint и делаем его исполняемым
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser
USER appuser

# Порт FastAPI
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]