import os
from fastapi import APIRouter, UploadFile, File, Depends, Body

from sqlalchemy.orm import Session


from src.core.database import get_db

from src.shared.dependencies import get_current_user
from src.modules.documents.models.document import Document
from src.modules.users.models.user import User

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

from src.modules.documents.utils.file_hash import (
    calculate_file_hash
)







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
        
    file_hash = calculate_file_hash(
        file_path
    )
    
    existing = db.query(
        Document
    ).filter(
        Document.file_hash == file_hash,
        Document.uploaded_by == user.id
    ).first()

    # if existing:
    #     return {
    #         "message": "File already uploaded",
    #         "document_id": existing.id
    #     }
    
    #for Better response
    if existing:

        if os.path.exists(file_path):
            os.remove(file_path)

        return {
            "message": "File already uploaded",
            "document_id": existing.id
        }


    document = Document(
        title=file.filename,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.filename.split(".")[-1],
        file_hash=file_hash,
        uploaded_by=user.id
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    chunks = process_document(file_path)

    # This prevents empty files, scanned PDFs with no text
    if not chunks:
        return {
            "message": "No content extracted from document"
        }
    
    save_chunk = save_chunks(
        db=db,
        document_id = document.id,
        chunks = chunks
    )
    
    #Adding automatice indexing
    vector_service = VectorStoreService()
    #vector_service.create_collection()
    
    saved_chunks = db.query(
        DocumentChunk
    ).filter(
        DocumentChunk.document_id == document.id
    ).all()
    
    indexed_count = 0

    for chunk in saved_chunks:

        embedding = EmbeddingsService.generate(
            chunk.chunk_text
        )

        vector_service.insert_chunk(
            chunk_id=chunk.id,
            document_id=document.id,
            filename=document.file_name,
            uploaded_by=document.uploaded_by,
            uploaded_by_name=user.full_name,
            text=chunk.chunk_text,
            embedding=embedding
        )

        indexed_count += 1
    
    
    return {
        "message": "Uploaded and indexed successfully",
        "document_id": document.id,
        "chunks_saved": save_chunk,
        "chunks_indexed": indexed_count
    }

#New Index API
@router.post("/index/{document_id}")
def index_document(
    document_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
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

    uploader = db.query(
        User
    ).filter(
        User.id == document.uploaded_by
    ).first()

    indexed_count = 0

    for chunk in chunks:

        embedding = EmbeddingsService.generate(
            chunk.chunk_text
        )

        vector_service.insert_chunk(
            chunk_id=chunk.id,
            document_id=document_id,
            filename=document.file_name,
            uploaded_by=document.uploaded_by,
            uploaded_by_name=uploader.full_name,
            text=chunk.chunk_text,
            embedding=embedding
        )

        indexed_count += 1

    return {
        "message": "Document Indexed successfully",
        "document_id": document_id,
        "chunks_indexed": indexed_count
    }


#for search
@router.post("/search")
def search_documents(
    query: str = Body(...),
    user=Depends(get_current_user)
):

    embedding = EmbeddingsService.generate(
        query
    )

    vector_service = VectorStoreService()

    results = vector_service.search(
        embedding
        #uploaded_by=user.id
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
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    documents = db.query(
        Document
    ).filter(
        Document.uploaded_by == user.id
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
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    document = db.query(
        Document
    ).filter(
        Document.id == document_id,
        Document.uploaded_by == user.id
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
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    #better accuracy
    document = db.query(
        Document
    ).filter(
        Document.id == document_id,
        Document.uploaded_by == user.id
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
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    
    document = db.query(
        Document
    ).filter(
        Document.id == document_id,
        Document.uploaded_by == user.id
    ).first()

    if not document:
        return {
            "message": "Document not found"
        }
    
    # Delete vectors from Qdrant
    vector_service = VectorStoreService()

    vector_service.delete_document_vectors(
        document.id
    )

    # Delete physical file
    if (
        document.file_path and
        os.path.exists(document.file_path)
    ):
        os.remove(document.file_path)

    # Delete database record
    db.delete(document)
    db.commit()

    return {
        "message": "Document deleted"
    }






