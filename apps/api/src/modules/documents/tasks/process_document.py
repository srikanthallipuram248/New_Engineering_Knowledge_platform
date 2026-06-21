from pathlib import Path

from src.modules.documents.services.document_processor import (
    DocumentProcessor
)


def process_document(
    file_path: str
):

    suffix = Path(file_path).suffix.lower()

    # Excel
    if suffix in [".xlsx", ".xls"]:

        rows = DocumentProcessor.extract_excel_rows(
            Path(file_path)
        )

        return rows

    # Everything else
    text = DocumentProcessor.extract_text(
        file_path
    )

    if not text:
        return []

    return DocumentProcessor.chunk_text(
        text
    )