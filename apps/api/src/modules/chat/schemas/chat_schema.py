from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from uuid import UUID

class ChatRequest(BaseModel):
    question: str
    session_id: UUID
    document_ids: Optional[List[int]] = None


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
    session_id: UUID
    answer_source: str
    # Server-side ChatMessage.id for the assistant turn — used by the
    # client to attach thumbs up/down feedback against the right row.
    message_id: Optional[int] = None
    sources: List[SourceResponse] = Field(
        default_factory=list
    )


# ── Feedback ──────────────────────────────────────────────────────────────
# Schema for POST /chat/feedback — records a per-user thumbs up/down on a
# specific assistant ChatMessage row.

VALID_RATINGS = {"helpful", "not_helpful"}


class FeedbackRequest(BaseModel):
    message_id: int
    rating: str = Field(
        ...,
        description="Either 'helpful' or 'not_helpful'"
    )