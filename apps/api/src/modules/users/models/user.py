from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

#import database base
from src.core.database import Base


#create a user table
class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )
    
    full_name: Mapped[str] = mapped_column(
        String(250),
        nullable=True
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True
    )
    
    hashed_password: Mapped[str] = mapped_column(
        String(255)
    )
    
    role: Mapped[str] = mapped_column(
        String(50),
        default="Engineer"
    )
    
    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False
    )
    
    
    





