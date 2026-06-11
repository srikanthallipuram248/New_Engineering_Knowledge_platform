from pydantic import BaseModel, Field
from typing import List, Dict, Any




# class ChatRequest(BaseModel):
#     question: str

# class ChatResponse(BaseModel):
#     answer: str


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = Field(decimal_places=list)



