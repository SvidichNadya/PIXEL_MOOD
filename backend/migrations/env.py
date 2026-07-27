# backend/migrations/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os

# Импортируем Base и модели (имена классов берём из ваших файлов)
from app.models.base import Base
from app.models.user import User
from app.models.mood import Mood
from app.models.calendar import Calendar
from app.models.reaction import Reaction
from app.models.payment import Payment
from app.models.support import SupportRequest   # именно SupportRequest, как в вашем файле
from app.models.notification import Notification

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# --- Используем переменную окружения DATABASE_URL (синхронный) ---
sync_database_url = os.environ.get("DATABASE_URL")
if sync_database_url:
    config.set_main_option("sqlalchemy.url", sync_database_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode (синхронно)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()