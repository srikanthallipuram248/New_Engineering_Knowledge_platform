from pydantic import BaseModel, Field
from typing import List, Optional


class ChatRequest(BaseModel):
    question: str
    document_ids: Optional[List[int]] = None


class SourceResponse(BaseModel):
    document_id: int
    filename: str

    uploaded_by: Optional[int] = None
    uploaded_by_name: Optional[str] = None

    rerank_score: float
    snippet: str


class ChatResponse(BaseModel):
    answer: str

    sources: List[SourceResponse] = Field(
        default_factory=list
    )