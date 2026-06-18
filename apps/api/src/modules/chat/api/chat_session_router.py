from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from src.core.database import get_db

from src.shared.dependencies import get_current_user

from src.modules.chat.services.chat_session_service import ChatSessionService

from src.modules.chat.schemas.chat_session_schema import CreateSessionRequest


router = APIRouter(
    prefix="/chat-sessions",
    tags=["Chat Session"]
)

@router.post("")
def create_session(
    payload: CreateSessionRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    session = ChatSessionService.create(
        db=db,
        user_id=user.id,
        title=payload.title
    )

    return session


# --------------
# get session list
# ---------------

@router.get("")
def get_session(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    return ChatSessionService.list_sessions(
        db=db,
        user_id=user.id
    )




