from src.modules.documents.services.search_service import (
    SearchService
)

from src.modules.documents.services.bm25_service import (
    BM25Service
)

from src.ai_platform.ai.rag.reranker_service import (
    RerankerService
)

from src.ai_platform.ai.rag.query_expansion_service import (
    QueryExpansionService
)


class HybridSearchService:

    @staticmethod
    def search(
        query: str,
        limit: int = 10,
        filters: dict = None
    ):

        expanded_queries = QueryExpansionService.expand(
            query
        )

        all_results = []

        for q in expanded_queries:

            results = SearchService.search(
                query=q,
                limit=50,
                filters=filters
            )

            all_results.extend(
                results
            )

        # Remove duplicates
        unique_results = {}

        for item in all_results:

            key = (
                item["document_id"],
                item["text"]
            )

            if key not in unique_results:
                unique_results[key] = item

        vector_results = list(
            unique_results.values()
        )

        if not vector_results:
            return []

        bm25_results = BM25Service.search(
            query=query,
            documents=vector_results,
            limit=30
        )

        if not bm25_results:
            return []

        reranked = RerankerService.rerank(
            query=query,
            results=bm25_results,
            top_k=limit
        )

        if not reranked:
            return []

        print(
            f"HYBRID: "
            f"query='{query}' "
            f"vector={len(vector_results)} "
            f"bm25={len(bm25_results)} "
            f"reranked={len(reranked)}"
        )

        return reranked
    
    
    
    