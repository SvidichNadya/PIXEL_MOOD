# Mood Pixel — Мировой дневник настроения 🎨🌍

Mood Pixel — это интерактивный дневник настроений, где каждый пользователь может оставить свой «след» в виде цветного пикселя на общем или приватном календаре. Проект объединяет людей со всего мира, позволяя делиться эмоциями и видеть настроение других.

## Стек технологий
Backend: FastAPI (Python 3.11), SQLAlchemy, Alembic, PostgreSQL, Redis, JWT-аутентификация

Frontend: React 18, Vite, Tailwind CSS, React Router, i18next (многоязычность)

Инфраструктура: Docker, Docker Compose, Nginx (раздача статики)

## Возможности
- Глобальный календарь настроений (один пиксель на пользователя в день)
- Приватные календари для общения с друзьями
- Выбор цвета из палитры с психологическими названиями
- Анонимность (настройка по умолчанию)
- Реакции на пиксели (👍, ❤️, 😂, 😮, 😢)
- Уведомления о новых реакциях и приглашениях в календарь
- Административная панель для обработки заявок в поддержку
- Онбординг для новых пользователей
- Поддержка русского и английского языков
- Адаптивный дизайн для мобильных устройств

## 📦 Требования
Для запуска необходимо иметь установленные:

Docker (версия 20.10+)

Docker Compose (версия 2.0+)

Git

## 🚀 Быстрый старт
1. Клонирование репозитория
bash
git clone https://github.com/yourusername/mood-pixel.git
cd mood-pixel
2. Настройка переменных окружения
Создайте файл .env в корне проекта со следующим содержимым:

env
#### PostgreSQL
POSTGRES_USER=mood
POSTGRES_PASSWORD=ваш_пароль
POSTGRES_DB=moodpixel

#### Backend
SECRET_KEY=ваш_секретный_ключ_jwt

#### VK (опционально)
VK_APP_ID=
VK_SECRET=

#### Telegram (опционально)
TG_BOT_TOKEN=
TG_BOT_SECRET=

#### ЮKassa (опционально)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

#### CORS
ALLOWED_ORIGINS=http://localhost,http://localhost:5173

#### Frontend (для сборки)
VITE_API_BASE=http://backend:8000
⚠️ Важно: замените ваш_пароль и ваш_секретный_ключ_jwt на надёжные значения.
Поля VK_*, TG_*, YOOKASSA_* можно оставить пустыми – они опциональны для локальной разработки.

3. Запуск проекта
Все сервисы (база данных, Redis, бекенд, фронтенд) поднимаются одной командой:

bash
docker-compose up -d --build
Эта команда:

Соберёт образы бекенда и фронтенда

Применит все миграции Alembic (автоматически через entrypoint)

Запустит сервера

После успешного запуска будут доступны:

Веб-интерфейс: http://localhost

API бекенда: http://localhost:8000

Документация API (Swagger): http://localhost:8000/docs

4. Создание администратора
По умолчанию все пользователи регистрируются с правами обычных пользователей.
Чтобы назначить пользователя администратором, выполните следующие шаги:

Зарегистрируйтесь в приложении (через http://localhost).

Подключитесь к базе данных в контейнере:

bash
docker-compose exec db psql -U mood moodpixel
Выполните SQL-запрос, заменив your_username на имя пользователя, которому хотите дать права администратора:

sql
UPDATE users SET is_admin = true WHERE username = 'your_username';
Выйдите из psql (\q) и перезагрузите страницу – в навигационной панели появится пункт «Админка».

Теперь вы можете обрабатывать заявки в поддержку через административный интерфейс.

## 🛠️ Разработка и отладка
Просмотр логов
bash
### Логи бекенда
docker-compose logs backend --tail 100 -f

### Логи фронтенда
docker-compose logs frontend --tail 100 -f
Пересборка отдельных сервисов
bash
### Только бекенд
docker-compose build --no-cache backend
docker-compose up -d backend

### Только фронтенд
docker-compose build --no-cache frontend
docker-compose up -d frontend
Доступ к контейнерам
bash
### Зайти в контейнер бекенда
docker-compose exec backend bash

### Зайти в контейнер базы данных
docker-compose exec db psql -U mood moodpixel

## 📁 Структура проекта
text
mood-pixel/
├── backend/              # FastAPI приложение
│   ├── app/              # Основной код (модели, API, сервисы)
│   ├── migrations/       # Alembic миграции
│   ├── Dockerfile        # Сборка бекенда
│   └── entrypoint.sh     # Точка входа (запуск миграций и uvicorn)
├── frontend/             # React приложение
│   ├── src/              # Исходный код
│   ├── public/           # Статика (иконки, локали)
│   ├── Dockerfile        # Многоступенчатая сборка
│   └── nginx.conf        # Конфигурация Nginx для раздачи статики
├── docker-compose.yml    # Оркестрация контейнеров
└── .env                  # Переменные окружения (не коммитится!)

## 🧪 Тестирование
Для запуска тестов (если они реализованы) выполните:

bash
docker-compose exec backend pytest

## 🔧 Возможные проблемы и решения
1. Ошибка при сборке: parent snapshot does not exist
Это проблема кеша Docker. Решение:

bash
docker builder prune -a -f
docker system prune -f
docker-compose build --no-cache
2. Бекенд не подключается к БД
Убедитесь, что в .env правильно указан DATABASE_URL (используется имя сервиса db внутри сети Docker):

env
DATABASE_URL=postgresql+asyncpg://mood:ваш_пароль@db:5432/moodpixel
3. Фронтенд не видит API
Если вы запускаете проект локально без Docker, отредактируйте frontend/vite.config.js или установите VITE_API_BASE=http://localhost:8000 в .env и пересоберите фронтенд.

4. 502 Bad Gateway
Обычно означает, что бекенд не запустился или упал. Проверьте логи:

bash
docker-compose logs backend --tail 50

## 🤝 Вклад в проект
Если вы хотите внести свой вклад:

Форкните репозиторий.

Создайте ветку для вашей фичи (git checkout -b feature/amazing-feature).

Сделайте коммиты и отправьте пул-реквест.

## 🌐 Ссылки
Документация API (Swagger): http://localhost:8000/docs