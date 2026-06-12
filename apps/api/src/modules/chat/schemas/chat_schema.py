from pydantic import BaseModel, Field
from typing import List


class ChatRequest(BaseModel):
    question: str


class SourceResponse(BaseModel):
    document_id: int
    filename: str
    rerank_score: float
    snippet: str


class ChatResponse(BaseModel):
    answer: str

    sources: List[SourceResponse] = Field(
        default_factory=list
    )