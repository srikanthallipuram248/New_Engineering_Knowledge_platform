from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from sqlalchemy.orm import Session
from jose import jwt, JWTError

from src.core.database import get_db
from src.core.config import settings
from src.core.security import create_access_token

from src.modules.users.schemas.user import(
    RegisterRequest,
    LoginRequest,
    TokenRequest
)

from src.modules.users.services.user_service import UserService
from src.modules.auth.services.auth_service import AuthService
from src.modules.users.respositories.user_repository import UserRepository


class RefreshRequest(BaseModel):
    refresh_token: str


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

#for register
@router.post("/register")
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db)
):
    try:
        UserService.create_user(
            db=db,
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password
        )
        return {
            "message": "User registered successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


#Login
@router.post(
    "/login",
    response_model=TokenRequest
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    try:
        tokens = AuthService.login(
            db=db,
            email=payload.email,
            password=payload.password
        )
        return tokens
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )


# Refresh — exchange a valid refresh token for a new access token
@router.post("/refresh")
def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db)
):
    try:
        data = jwt.decode(
            payload.refresh_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = data.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token expired or invalid")

    user = UserRepository.get_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {"access_token": create_access_token(str(user.id))}


