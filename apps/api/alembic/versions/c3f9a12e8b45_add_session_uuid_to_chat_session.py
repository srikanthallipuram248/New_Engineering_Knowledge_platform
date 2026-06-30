"""add session_uuid to chat_session

Revision ID: c3f9a12e8b45
Revises: b81bf5d7f22b
Create Date: 2026-06-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = 'c3f9a12e8b45'
down_revision: Union[str, Sequence[str], None] = 'b81bf5d7f22b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # chat_session.session_uuid already exists in DB (created via create_all)
    # Only need to add session_id to chat_messages

    # Add as nullable first — existing rows have no session
    op.add_column(
        'chat_messages',
        sa.Column('session_id', sa.Integer(), nullable=True)
    )
    # Delete orphaned messages that have no session (old data, not useful)
    op.execute("DELETE FROM chat_messages WHERE session_id IS NULL")
    # Now add FK and enforce NOT NULL
    op.create_foreign_key(
        'fk_chat_messages_session_id',
        'chat_messages', 'chat_session',
        ['session_id'], ['id']
    )
    op.alter_column('chat_messages', 'session_id', nullable=False)


def downgrade() -> None:
    op.drop_constraint('fk_chat_messages_session_id', 'chat_messages', type_='foreignkey')
    op.drop_column('chat_messages', 'session_id')
