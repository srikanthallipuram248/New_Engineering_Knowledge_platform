from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: int
    title: str
    file_name: str
    file_type: str

    class Config:
        from_attributes = True
        
        
        