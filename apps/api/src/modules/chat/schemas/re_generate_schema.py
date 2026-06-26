from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class RegenerateRequest(BaseModel):

    question: str
    session_id: UUID
    document_ids: Optional[List[int]] = None