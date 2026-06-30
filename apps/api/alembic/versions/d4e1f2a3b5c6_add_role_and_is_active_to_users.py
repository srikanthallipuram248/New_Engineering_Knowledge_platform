"""add role and is_active to users

Revision ID: d4e1f2a3b5c6
Revises: c3f9a12e8b45
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd4e1f2a3b5c6'
down_revision: Union[str, Sequence[str], None] = 'c3f9a12e8b45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Engineer'"))
    conn.execute(sa.text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true"))


def downgrade() -> None:
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'role')
