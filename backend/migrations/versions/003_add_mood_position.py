"""add mood position

Revision ID: 003
Revises: 002
Create Date: 2026-07-26 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('moods', sa.Column('position', sa.Integer(), nullable=True))
    op.create_index('ix_moods_position', 'moods', ['position'])


def downgrade() -> None:
    op.drop_index('ix_moods_position')
    op.drop_column('moods', 'position')