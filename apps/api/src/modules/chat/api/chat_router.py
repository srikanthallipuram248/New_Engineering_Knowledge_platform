from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db


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
    response = ChatService.ask(
        question=request.question,
        db=db,
        user=user
    )

    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        role="assistant",
        content=response["answer"]
    )

    return ChatResponse(
        answer=response["answer"],
        sources=response["sources"]
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

    result = ChatService.ask(
        question=payload.question,
        db=db,
        user=user
    )

    # Save regenerated answer
    ChatHistoryService.save(
        db=db,
        user_id=user.id,
        role="assistant",
        content=result["answer"]
    )

    return result






