from sqlalchemy.orm import Session

from src.core.security import(
    verify_password,
    create_access_token,
    create_refresh_token
)

from src.modules.users.respositories.user_repository import UserRepository

class AuthService:
    
    @staticmethod
    def login(
        db: Session,
        email: str,
        password: str
    ):
        user = UserRepository.get_by_email(
            db,
            email
        )
        
        if not user:
            raise ValueError(
                "Invalid credentials"
            )

        if not verify_password(
            password,
            user.hashed_password
        ):
            raise ValueError(
                "Invalid credentials or password incorect"
            )
        
        access_token = create_access_token(
            str(user.id)
        )
        
        refresh_token = create_refresh_token(
            str(user.id)
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

