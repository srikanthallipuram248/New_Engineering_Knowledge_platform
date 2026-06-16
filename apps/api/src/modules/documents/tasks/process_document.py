from src.modules.documents.services.document_processor import (
    DocumentProcessor
)

def process_document(
    file_path: str
):
    text = DocumentProcessor.extract_text(
        file_path
    )

    if not text:
        return []

    chunks = DocumentProcessor.chunk_text(
        text
    )

    return chunks