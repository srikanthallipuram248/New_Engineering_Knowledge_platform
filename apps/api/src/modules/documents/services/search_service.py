from src.modules.documents.services.embedding_service import (
    EmbeddingsService
)

from src.modules.documents.services.vector_store_service import (
    VectorStoreService
)

class SearchService:
    
    @staticmethod
    def search(
        query: str,
        limit: int = 5,
        filters: dict = None,
        uploaded_by: int = None
    ):
        embedding = EmbeddingsService.generate(
            query
        )

        vector_store = VectorStoreService()

        return vector_store.search(
            embedding=embedding,
            limit=limit,
            filters=filters,
            uploaded_by=uploaded_by
        )










