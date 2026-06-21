from sqlalchemy.orm import Session

#Import User models or User table
from src.modules.users.models.user import User


class UserRepository:
    
    @staticmethod
    def get_by_email(
        db: Session,
        email: str
    ) -> User | None:
        
        return (
            db.query(User)
            .filter(User.email == email)
            .first()
        )
        
    #New User create
    @staticmethod
    def create(
        db: Session,
        user: User
    ) -> User:
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    
    # Get user by id
    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int
    ):
        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )
    
    
    