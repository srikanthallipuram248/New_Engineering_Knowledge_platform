from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from src.core.database import get_db

from src.modules.users.schemas.user import(
    RegisterRequest,
    LoginRequest,
    TokenRequest
)

from src.modules.users.services.user_service import UserService
from src.modules.auth.services.auth_service import AuthService


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


