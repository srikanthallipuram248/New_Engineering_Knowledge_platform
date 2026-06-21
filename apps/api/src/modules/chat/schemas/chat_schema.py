from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional


class ChatRequest(BaseModel):
    session_id: int
    question: str
    #document_ids: Optional[List[int]] = None


class SourceResponse(BaseModel):

    model_config = ConfigDict(
        exclude_none=True
    )


    document_id: int
    filename: str

    uploaded_by: Optional[int] = None
    uploaded_by_name: Optional[str] = None

    rerank_score: float
    snippet: str

    # for source response
    code: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    intent: str

    sources: List[SourceResponse] = Field(
        default_factory=list
    )