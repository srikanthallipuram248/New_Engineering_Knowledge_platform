from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from src.core.database import get_db

from src.shared.dependencies import get_current_user

from src.modules.chat.services.chat_session_service import ChatSessionService

from src.modules.chat.schemas.chat_session_schema import (
    CreateSessionRequest,
    UpdateSessionRequest
)

from src.modules.chat.services.chat_history_service import ChatHistoryService



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
    
    return ChatSessionService.get_all(
        db=db,
        user_id=user.id
    )
    
    
# ---------------------
# Get single session 
# --------------------

@router.get("/{session_id}")
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    session = ChatSessionService.get_by_id(
        db=db,
        session_id=session_id,
        user_id=user.id
    )
    
    if not session:
        return {
            "message": "Session not found"
        }
        
    return session



# ----------------------
# Delete Session by ID
# -------------------
@router.delete("/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    deleted = ChatSessionService.session_delete(
        db=db,
        session_id=session_id,
        user_id=user.id
    )
    
    if not deleted:
        return {
            "message": "Session not found"
        }
        
    return {
        "message": "Session deleted"
    }




# --------------------------
# get session messages
# -------------------------
@router.get("/{session_id}/messages")
def get_session_messages(
    session_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    messages = (
        ChatHistoryService.get_session_messages(
            db=db,
            session_id=session_id
        )
    )

    return messages


# -----------------------
# title update
# ------------------------

@router.put("/{session_id}")
def update_session_title(
    session_id: int,
    payload: UpdateSessionRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):

    session = ChatSessionService.update_title(
        db=db,
        session_id=session_id,
        user_id=user.id,
        title=payload.title
    )

    if not session:
        return {
            "message": "Session not found"
        }

    return session








