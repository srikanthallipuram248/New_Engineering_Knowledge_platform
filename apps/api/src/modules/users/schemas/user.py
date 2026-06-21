from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenRequest(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"




