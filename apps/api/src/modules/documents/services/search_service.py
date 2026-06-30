from src.modules.documents.services.embedding_service import (
    EmbeddingsService
)

from src.modules.documents.services.vector_store_service import (
    VectorStoreService
)

# Shared instance — avoids reconnecting to Qdrant on every search call
_vector_store = VectorStoreService()

class SearchService:

    @staticmethod
    def search(
        query: str,
        limit: int = 200,
        filters: dict = None
    ):
        embedding = EmbeddingsService.generate(query)

        return _vector_store.search(
            embedding=embedding,
            limit=limit,
            filters=filters
        )










