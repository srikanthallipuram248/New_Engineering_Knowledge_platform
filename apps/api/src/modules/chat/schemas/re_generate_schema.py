from pydantic import BaseModel

class RegenerateRequest(BaseModel):

    question: str


    