from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from src.core.database import get_db
from src.modules.chat.models.chat_session import (
    ChatSession
)
from src.modules.chat.schemas.chat_schema import (
    ChatRequest,
    ChatResponse
)

from src.modules.chat.services.chat_service import (
    ChatService
)

from src.shared.dependencies import (
    get_current_user
)

# from src.modules.chat.services.chat_history_service import (
#     ChatMessage
# )

from src.modules.chat.models.chat_message import (
    ChatMessage
)

from src.modules.chat.services.chat_history_service import (
    ChatHistoryService
)

# New Generate question and answer schema
from src.modules.chat.schemas.re_generate_schema import (
    RegenerateRequest
)




router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

@router.post(
    "",
    response_model=ChatResponse,
    response_model_exclude_none=True
)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.session_uuid == request.session_id,
            ChatSession.user_id == user.id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Invalid session"
        )
    
    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        #session_id=request.session_id,
        session_id=session.id,
        role="user",
        content=request.question
    )

    response = ChatService.ask(
        question=request.question,
        session_id=session.id,
        document_ids=request.document_ids,
        db=db,
        user=user
    )

    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        #session_id=request.session_id,
        session_id=session.id,
        role="assistant",
        content=response["answer"]
    )

    return ChatResponse(
        answer=response["answer"],
        session_id=session.session_uuid,
        sources=response["sources"]
    )

    

#History router

@router.get("/history/{session_id}")
def get_history(
    session_id: UUID,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.session_uuid == session_id,
            ChatSession.user_id == user.id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Invalid session"
        )

    chats = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user.id,
            ChatMessage.session_id == session.id
        )
        .order_by(ChatMessage.id.asc())
        .all()
    )

    return chats



# ------------------------
#  Re-Generate question and answer
# --------------------------------
@router.post("/regenerate")
def regenerate_answer(
    payload: RegenerateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    

    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.session_uuid == payload.session_id,
            ChatSession.user_id == user.id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Invalid session"
        )
    
    # Save edited question
    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        session_id=session.id,
        role="user",
        content=payload.question
    )

    result = ChatService.ask(
        question=payload.question,
        document_ids=payload.document_ids,
        db=db,
        session_id=session.id,
        user=user
    )

    # Save regenerated answer
    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        session_id=session.id,
        role="assistant",
        content=result["answer"]
    )

    return result






