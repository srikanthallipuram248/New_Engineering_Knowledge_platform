from src.modules.documents.services.document_processor import (
    DocumentProcessor
)

def process_document(
    file_path: str
):
    text = DocumentProcessor.extract_text(file_path)
    
    chunks = DocumentProcessor.chunck_text(text)
    
    print(f"Text length: {len(text)}")
    print(f"CHunks Created: {len(chunks)}")
    
    return chunks