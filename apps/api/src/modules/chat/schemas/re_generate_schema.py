from typing import List, Optional
from pydantic import BaseModel

class RegenerateRequest(BaseModel):
    question: str
    document_ids: Optional[List[int]] = None


    