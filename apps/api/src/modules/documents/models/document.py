from sqlalchemy import String, Integer, DateTime, ForeignKey
from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from src.core.database import Base


#creating document database model or table
class Document(Base):
    __tablename__ = "documents"
    
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )
    
    title: Mapped[str] = mapped_column(
        String(255)
    )
    
    file_name: Mapped[str] = mapped_column(
        String(255)
    )
    
    file_path: Mapped[str] = mapped_column(
        String(400)
    )
    
    file_type: Mapped[str] = mapped_column(
        String(50)
    )
    
    #forrign key with another table
    uploaded_by: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    
    
    #Relationship
    chunks = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan"
    )

    
    
    
    
    