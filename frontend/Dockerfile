# ---- Этап сборки ----
FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем зеркало npm (npmmirror — стабильное зеркало)
RUN npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-timeout 600000
RUN npm config set fetch-retries 5

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force

# Копируем исходники и собираем
COPY . .
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# ---- Этап раздачи статики через nginx ----
FROM nginx:stable-alpine

# Установка curl для скрипта ожидания
RUN apk add --no-cache curl

# Копируем собранные файлы
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомный конфиг nginx (если есть)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Копируем скрипт ожидания
COPY wait-for-backend.sh /wait-for-backend.sh
RUN chmod +x /wait-for-backend.sh

# Запускаем скрипт вместо прямого запуска nginx
CMD ["/wait-for-backend.sh"]