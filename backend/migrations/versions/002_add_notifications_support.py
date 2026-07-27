"""add notifications and support

Revision ID: 002
Revises: 001
Create Date: 2026-07-26 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Добавляем поле is_admin в users
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), server_default='false', nullable=False))
    op.create_index('ix_users_is_admin', 'users', ['is_admin'])

    # Таблица уведомлений
    op.create_table('notifications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('link', sa.String(500), nullable=True),
        sa.Column('read', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_foreign_key('fk_notifications_user_id', 'notifications', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_read', 'notifications', ['read'])

    # Таблица заявок поддержки
    op.create_table('support_requests',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', UUID(as_uuid=True), nullable=True),
        sa.Column('username', sa.String(64), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('resolved', sa.Boolean(), server_default='false'),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('admin_response', sa.Text(), nullable=True),
    )
    op.create_foreign_key('fk_support_requests_user_id', 'support_requests', 'users', ['user_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_support_requests_user_id', 'support_requests', ['user_id'])
    op.create_index('ix_support_requests_resolved', 'support_requests', ['resolved'])


def downgrade() -> None:
    op.drop_table('support_requests')
    op.drop_table('notifications')
    op.drop_index('ix_users_is_admin')
    op.drop_column('users', 'is_admin')