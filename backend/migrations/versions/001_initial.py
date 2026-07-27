"""initial migration

Revision ID: 001
Revises:
Create Date: 2026-07-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Создаём таблицы
    op.create_table('users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('username', sa.String(32), nullable=False, unique=True),
        sa.Column('email', sa.String(255), nullable=True, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('vk_id', sa.String(32), nullable=True, unique=True),
        sa.Column('tg_id', sa.String(32), nullable=True, unique=True),
        sa.Column('display_name', sa.String(64), nullable=False),
        sa.Column('avatar_url', sa.String(255), nullable=True),
        sa.Column('is_anonymous_by_default', sa.Boolean(), server_default='true'),
        sa.Column('allow_paid_reveal', sa.Boolean(), server_default='true'),
        sa.Column('consent_to_reveal_given_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_vk_id', 'users', ['vk_id'])
    op.create_index('ix_users_tg_id', 'users', ['tg_id'])

    op.create_table('calendars',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', UUID(as_uuid=True), nullable=False),
        sa.Column('member_ids', ARRAY(UUID(as_uuid=True)), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_foreign_key('fk_calendars_owner_id', 'calendars', 'users', ['owner_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_calendars_owner_id', 'calendars', ['owner_id'])

    op.create_table('moods',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('color', sa.String(7), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('is_anonymous', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('calendar_id', UUID(as_uuid=True), nullable=True),
        sa.Column('is_global', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_foreign_key('fk_moods_user_id', 'moods', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_moods_calendar_id', 'moods', 'calendars', ['calendar_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_moods_user_id', 'moods', ['user_id'])
    op.create_index('ix_moods_date', 'moods', ['date'])
    op.create_index('ix_moods_calendar_id', 'moods', ['calendar_id'])
    op.create_index('ix_moods_user_id_date', 'moods', ['user_id', 'date'])

    op.create_table('reactions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('mood_id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_foreign_key('fk_reactions_mood_id', 'reactions', 'moods', ['mood_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_reactions_user_id', 'reactions', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_reactions_mood_id', 'reactions', ['mood_id'])
    op.create_index('ix_reactions_user_id', 'reactions', ['user_id'])
    op.create_index('ix_reactions_type', 'reactions', ['type'])
    op.create_index('ix_reactions_mood_user_type', 'reactions', ['mood_id', 'user_id', 'type'], unique=True)

    op.create_table('daily_stats',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('stat_date', sa.Date(), nullable=False),
        sa.Column('total_pixels', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('color_distribution', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index('ix_daily_stats_stat_date', 'daily_stats', ['stat_date'])

    op.create_table('payments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('mood_id', UUID(as_uuid=True), nullable=True),
        sa.Column('type', sa.Enum('donate', 'reveal', name='payment_type_enum'), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'success', 'failed', name='payment_status_enum'), nullable=False, server_default='pending'),
        sa.Column('external_payment_id', sa.String(100), nullable=True, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_foreign_key('fk_payments_user_id', 'payments', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_payments_mood_id', 'payments', 'moods', ['mood_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_payments_user_id', 'payments', ['user_id'])
    op.create_index('ix_payments_mood_id', 'payments', ['mood_id'])
    op.create_index('ix_payments_status', 'payments', ['status'])


def downgrade() -> None:
    op.drop_table('payments')
    op.drop_table('daily_stats')
    op.drop_table('reactions')
    op.drop_table('moods')
    op.drop_table('calendars')
    op.drop_table('users')
    # Удаление ENUM типов (если нужно)
    op.execute('DROP TYPE payment_type_enum')
    op.execute('DROP TYPE payment_status_enum')