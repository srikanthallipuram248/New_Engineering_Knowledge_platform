from pathlib import Path

class DocumentProcessor:
    
    @staticmethod
    def extract_text(file_path: str) -> str:
        path = Path(file_path)
        
        if path.suffix.lower() == ".txt":
            with open(path, "r", encoding="utf-8") as file:
                return file.read()
            
        raise ValueError(
            f"Unsupported file type : {path.suffix}"
        )
        
    #Create Text Chunking
    @staticmethod
    def chunck_text(
        text: str,
        chunk_size: int = 500,
        overlap: int = 50
    ) -> list[str]:
        
        chunks = []
        
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            chunks.append(text[start:end])
            
            start += chunk_size - overlap
            
        return chunks