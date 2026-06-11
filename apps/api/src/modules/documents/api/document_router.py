import os
from fastapi import APIRouter, UploadFile, File, Depends, Body

from sqlalchemy.orm import Session


from src.core.database import get_db

from src.shared.dependencies import get_current_user
from src.modules.documents.models.document import Document

from src.modules.documents.tasks.process_document import (
    process_document
)

from src.modules.documents.services.chunk_service import (
    save_chunks
)

from src.modules.documents.services.vector_store_service import (
    VectorStoreService
)

#New API imports
from src.modules.documents.models.document_chunk import (
    DocumentChunk
)

from src.modules.documents.models.document import (
    Document
)

from src.modules.documents.services.embedding_service import (
    EmbeddingsService
)

# from src.modules.documents.services.vector_store_service import (
#     VectorStoreService
# )






router = APIRouter(
    prefix="/documents",
    tags=["/Documents"]
)


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

#Upload API
@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        while chunk := file.file.read(1024 * 1024):
            buffer.write(chunk)
    
    document = Document(
        title=file.filename,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.filename.split(".")[-1],
        uploaded_by=user.id
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    chunks = process_document(file_path)
    
    save_chunk = save_chunks(
        db=db,
        document_id = document.id,
        chunks = chunks
    )
    
    
    return {
        "message": "Uploaded successfully",
        "document_id": document.id,
        #"chunks_created": len(chunks),
        "chunks_saved": save_chunk
    }

#New Index API
@router.post("/index/{document_id}")
def index_document(
    document_id: int,
    db: Session = Depends(get_db)
):

    document = db.query(
        Document
    ).filter(
        Document.id == document_id
    ).first()

    if not document:
        return {
            "message": "Document not found"
        }

    chunks = db.query(
        DocumentChunk
    ).filter(
        DocumentChunk.document_id == document_id
    ).all()

    if not chunks:
        return {
            "message": "No chunks found"
        }

    vector_service = VectorStoreService()

    indexed_count = 0

    for chunk in chunks:

        embedding = EmbeddingsService.generate(
            chunk.chunk_text
        )

        vector_service.insert_chunk(
            chunk_id=chunk.id,
            document_id=document_id,
            filename=document.file_name,
            text=chunk.chunk_text,
            embedding=embedding
        )

        indexed_count += 1

    return {
        "message": "Document Indexed successfully",
        "document_id": document_id,
        "chunks_indexed": indexed_count
    }




#vector store
@router.post("/create-vector-db")
def create_vector_db():

    service = VectorStoreService()

    service.create_collection()

    return {
        "message": "Qdrant collection created"
    }


#for search
@router.post("/search")
def search_documents(
    query: str = Body(...),
):

    embedding = EmbeddingsService.generate(
        query
    )

    vector_service = VectorStoreService()

    results = vector_service.search(
        embedding
    )

    return {
        "query": query,
        "results": results
    }
    
    
    
#------------------------------
# Get all document list
# ----------------------------

@router.get("")
def list_documents(
    db: Session = Depends(get_db)
):
    
    documents = db.query(
        Document
    ).all()

    return [
        {
            "id": doc.id,
            "title": doc.title,
            "file_name": doc.file_name,
            "file_type": doc.file_type,
            "created_at": doc.created_at
        }
        for doc in documents
    ]

    
#Documents details API
@router.get("/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    
    document = db.query(
        Document
    ).filter(
        Document.id == document_id
    ).first()

    if not document:
        return {
            "message": "Document not found"
        }

    return {
        "id": document.id,
        "title": document.title,
        "file_name": document.file_name,
        "file_type": document.file_type,
        "created_at": document.created_at,
        "chunks": len(document.chunks)
    }




#Document Chunk API
@router.get("/{document_id}/chunks")
def get_document_chunks(
    document_id: int,
    db: Session = Depends(get_db)
):
    
    chunks = db.query(
        DocumentChunk
    ).filter(
        DocumentChunk.document_id == document_id
    ).all()

    return [
        {
            "chunk_id": chunk.id,
            "chunk_index": chunk.chunk_index,
            "text": chunk.chunk_text[:500]
        }
        for chunk in chunks
    ]

#Delete Document API
@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    
    document = db.query(
        Document
    ).filter(
        Document.id == document_id
    ).first()

    if not document:
        return {
            "message": "Document not found"
        }
    
    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted"
    }






