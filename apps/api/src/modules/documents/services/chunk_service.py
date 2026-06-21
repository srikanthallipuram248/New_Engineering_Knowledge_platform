from sqlalchemy.orm import Session

from src.modules.documents.models.document_chunk import (
    DocumentChunk
)


def save_chunks(
    db: Session,
    document_id: int,
    chunks: list[str]
):
    
    records = []
    
    for index, chunk in enumerate(chunks):
        
        records.append(
            DocumentChunk(
                document_id = document_id,
                chunk_index = index,
                chunk_text = chunk
            )
        )


    db.add_all(records)
    db.commit()
    
    return len(records)



