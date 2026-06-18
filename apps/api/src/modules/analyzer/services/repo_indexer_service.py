from sqlalchemy.orm import Session

from src.core.database import SessionLocal
from src.modules.documents.models.document import Document
from src.modules.documents.models.document_chunk import DocumentChunk
from src.modules.documents.services.document_processor import DocumentProcessor
from src.modules.documents.services.chunk_service import save_chunks
from src.modules.documents.services.embedding_service import EmbeddingsService
from src.modules.documents.services.vector_store_service import VectorStoreService
from src.modules.documents.utils.file_hash import calculate_text_hash
from src.modules.users.models.user import User
from src.modules.analyzer.services.repo_scanner_service import IndexableFile

# Cap on total chunks across the whole repo — keeps the background
# embedding pass fast even if every indexed file is chunk-heavy.
_MAX_TOTAL_CHUNKS = 800


def get_or_create_repo_document(
    db: Session,
    git_url: str,
    repo_name: str,
    user: User,
) -> tuple[Document, bool]:
    """Returns (document, is_new). Re-analyzing the same repo reuses the
    existing document instead of duplicating it in Qdrant."""
    file_hash = calculate_text_hash(git_url)

    existing = db.query(Document).filter(
        Document.file_hash == file_hash,
        Document.uploaded_by == user.id,
    ).first()

    if existing:
        return existing, False

    document = Document(
        title=repo_name,
        file_name=repo_name,
        file_path=git_url,
        file_type="repo",
        file_hash=file_hash,
        uploaded_by=user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return document, True


def save_repo_chunks(
    db: Session,
    document_id: int,
    indexable_files: list[IndexableFile],
) -> int:
    """Splits each file's content into chunks (tagged with its path) and
    saves them to Postgres. Fast — no embeddings generated here."""
    chunks: list[str] = []

    for file in indexable_files:
        if len(chunks) >= _MAX_TOTAL_CHUNKS:
            break

        for piece in DocumentProcessor.chunk_text(file.content):
            chunks.append(f"// {file.path}\n{piece}")
            if len(chunks) >= _MAX_TOTAL_CHUNKS:
                break

    if not chunks:
        return 0

    return save_chunks(db=db, document_id=document_id, chunks=chunks)


def embed_and_index_repo_chunks(document_id: int) -> None:
    """
    Slow part — runs as a FastAPI background task so the analysis
    response isn't held up waiting on embedding generation. Opens its
    own DB session since the request-scoped one is already closed by
    the time this runs.
    """
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return

        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document_id
        ).all()
        if not chunks:
            return

        uploader = db.query(User).filter(User.id == document.uploaded_by).first()
        uploader_name = uploader.full_name if uploader else None

        embeddings_service = EmbeddingsService()
        embeddings = embeddings_service.generate_embeddings(
            [chunk.chunk_text for chunk in chunks]
        )

        vector_service = VectorStoreService()
        for chunk, embedding in zip(chunks, embeddings):
            vector_service.insert_chunk(
                chunk_id=chunk.id,
                document_id=document.id,
                filename=document.file_name,
                uploaded_by=document.uploaded_by,
                uploaded_by_name=uploader_name,
                text=chunk.chunk_text,
                embedding=embedding,
            )
    finally:
        db.close()
