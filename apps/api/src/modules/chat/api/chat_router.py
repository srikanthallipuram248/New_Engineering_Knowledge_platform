from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.modules.chat.models.admin_models import FailedQuery


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

from src.modules.chat.services.chat_history_service import (
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


def _failure_reason(error: Exception) -> str:
    message = str(error).strip()
    if message and len(message) <= 120:
        return message[:255]
    return type(error).__name__[:255]


def _log_failed_query(
    db: Session,
    question: str,
    user_id: int,
    document_ids: list[int] | None,
    reason: str
):
    try:
        first_doc_id = document_ids[0] if document_ids else None
        db.add(
            FailedQuery(
                question=question,
                user_id=user_id,
                repository_id=first_doc_id,
                failure_reason=reason[:255],
            )
        )
        db.commit()
    except Exception as log_err:
        print(f"[FailedQuery] Could not log failure: {log_err}")
        db.rollback()


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
    
    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        role="user",
        content=request.question
    )

    # answer = ChatService.ask(
    #     db=db,
    #     user=user,
    #     question=request.question
    # )

    # return ChatResponse(
    #     answer=answer
    # )

    #New
    try:
        response = ChatService.ask(
            question=request.question,
            document_ids=request.document_ids,
            db=db,
            user=user
        )

        ChatHistoryService.save(
            db=db,
            user_id=user.id,
            role="assistant",
            content=response["answer"]
        )

        if response.get("failure_reason"):
            _log_failed_query(
                db=db,
                question=request.question,
                user_id=user.id,
                document_ids=request.document_ids,
                reason=response["failure_reason"]
            )

        return ChatResponse(
            answer=response["answer"],
            sources=response.get("sources", []),
            intent=response.get("intent", "rag")
        )
    except Exception as e:
        print(f"Error in chat endpoint: {e}")

        _log_failed_query(
            db=db,
            question=request.question,
            user_id=user.id,
            document_ids=request.document_ids,
            reason=_failure_reason(e)
        )

        # Fallback response
        error_msg = "I encountered an error while processing your request. Please try again later."

        ChatHistoryService.save(
            db=db,
            user_id=user.id,
            role="assistant",
            content=error_msg
        )

        return ChatResponse(
            answer=error_msg,
            sources=[],
            intent="chat"
        )

    
    
    


#History router

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    chats = db.query(
        ChatMessage
    ).filter(
        ChatMessage.user_id == user.id
    ).order_by(
        ChatMessage.id.asc()
    ).all()

    return chats



# ------------------------
#  Re-Generate question and answer
# --------------------------------

@router.post(
    "/regenerate"
)
def regenerate_answer(
    payload: RegenerateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    # Save edited question
    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        role="user",
        content=payload.question
    )

    try:
        result = ChatService.ask(
            question=payload.question,
            db=db,
            user=user
        )
    except Exception as e:
        print(f"Error in regenerate endpoint: {e}")
        _log_failed_query(
            db=db,
            question=payload.question,
            user_id=user.id,
            document_ids=None,
            reason=_failure_reason(e)
        )
        result = {
            "answer": "I encountered an error while processing your request. Please try again later.",
            "sources": [],
            "intent": "chat"
        }

    # Save regenerated answer
    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        role="assistant",
        content=result["answer"]
    )

    if result.get("failure_reason"):
        _log_failed_query(
            db=db,
            question=payload.question,
            user_id=user.id,
            document_ids=None,
            reason=result["failure_reason"]
        )

    return result





