from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.core.database import get_db

from src.modules.chat.schemas.chat_schema import (
    ChatRequest,
    ChatResponse
)

from src.modules.chat.services.chat_service import (
    ChatService
)

from src.modules.chat.services.chat_history_service import (
    ChatHistoryService
)

from src.modules.chat.models.chat_session import (
    ChatSession
)

from src.modules.chat.services.chat_title_service import (
    ChatTitleService
)

from src.shared.dependencies import (
    get_current_user
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
    user=Depends(get_current_user)
):

    # -----------------------
    # Validate Session
    # -----------------------
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == request.session_id,
            ChatSession.user_id == user.id
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Invalid session id"
        )

    # -----------------------
    # Save User Message
    # -----------------------
    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        session_id=request.session_id,
        role="user",
        content=request.question
    )

    # -----------------------
    # Auto Generate Title
    # -----------------------
    if session.title == "New Chat":

        session.title = ChatTitleService.generate(
            request.question
        )

        db.commit()

    # -----------------------
    # Generate Answer
    # -----------------------
    try:

        response = ChatService.ask(
            question=request.question,
            db=db,
            session_id=request.session_id,
            user=user
        )

        # -----------------------
        # Save Assistant Message
        # -----------------------
        ChatHistoryService.save(
            db=db,
            user_id=user.id,
            session_id=request.session_id,
            role="assistant",
            content=response["answer"]
        )

        return ChatResponse(
            answer=response["answer"],
            sources=response.get("sources", []),
            intent=response.get("intent", "rag")
        )

    except Exception as e:

        print(f"Error in chat endpoint: {e}")

        error_msg = (
            "I encountered an error while "
            "processing your request."
        )

        # -----------------------
        # Save Error Message
        # -----------------------
        ChatHistoryService.save(
            db=db,
            user_id=user.id,
            session_id=request.session_id,
            role="assistant",
            content=error_msg
        )

        return ChatResponse(
            answer=error_msg,
            sources=[],
            intent="chat"
        )
    
    