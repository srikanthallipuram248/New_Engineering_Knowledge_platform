from sqlalchemy import Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        nullable=False
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    chunk_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    document: Mapped["Document"] = relationship(
        back_populates="chunks"
    )
    
    
