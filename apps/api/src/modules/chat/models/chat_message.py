from sqlalchemy import (
    Integer,
    Text,
    ForeignKey,
    DateTime,
    func
)


from sqlalchemy.orm import Mapped, mapped_column

from datetime import datetime

from src.core.database import Base


class ChatMessage(Base):

    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id")
    )

    role: Mapped[str] = mapped_column(
        Text
    )

    content: Mapped[str] = mapped_column(
        Text
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )












