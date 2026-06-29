from sqlalchemy import (
    Integer,
    Text,
    String,
    ForeignKey,
    DateTime,
    Boolean,
    func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from src.core.database import Base

class ChatFeedback(Base):
    __tablename__ = "chat_feedback"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    message_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("chat_messages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    rating: Mapped[str] = mapped_column(
        String(20), # "helpful" or "not_helpful"
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

class FailedQuery(Base):
    __tablename__ = "failed_queries"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    question: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    repository_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True
    )

    failure_reason: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
