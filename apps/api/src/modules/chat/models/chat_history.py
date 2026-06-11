from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, func

from sqlalchemy.orm import Mapped, mapped_column

from datetime import datetime

#import
from src.core.database import Base



class ChatHistory(Base):

    __tablename__ = "chat_history"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    question: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    answer: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )














