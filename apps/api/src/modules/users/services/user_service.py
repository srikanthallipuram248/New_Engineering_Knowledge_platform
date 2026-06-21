from sqlalchemy.orm import Session


#imports Modules
from src.core.security import hash_password
from src.modules.users.models.user import User
from src.modules.users.respositories.user_repository import UserRepository


class UserService:
    
    @staticmethod
    def create_user(
        db: Session,
        full_name: str,
        email: str,
        password: str
    ) -> User:
        
        existing_user = UserRepository.get_by_email(
            db,
            email
        )
        
        if existing_user:
            raise ValueError(
                "User already exists"
            )
    
        user = User(
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password)
        )
        
        return UserRepository.create(
            db,
            user
        )