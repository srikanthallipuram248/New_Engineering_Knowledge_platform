from uuid import UUID

from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    title: str


class SessionResponse(BaseModel):
    id: int
    session_uuid: UUID
    title: str

    class Config:
        from_attributes = True


class UpdateSessionRequest(BaseModel):
    title: str
