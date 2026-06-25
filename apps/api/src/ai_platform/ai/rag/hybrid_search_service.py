from src.modules.documents.services.search_service import (
    SearchService
)

from src.modules.documents.services.bm25_service import (
    BM25Service
)

from src.ai_platform.ai.rag.query_expansion_service import (
    QueryExpansionService
)


class HybridSearchService:

    @staticmethod
    def search(
        query: str,
        limit: int = 10,
        filters: dict = None,
        queries: list = None,
    ):
        # Use pre-built queries when provided (avoids a redundant Groq call
        # via QueryExpansionService). Fall back to expansion only when needed.
        if queries:
            expanded_queries = list(dict.fromkeys(q for q in queries if q))
        else:
            expanded_queries = QueryExpansionService.expand(query)

        all_results = []

        for q in expanded_queries:

            results = SearchService.search(
                query=q,
                limit=50,
                filters=filters
            )

            all_results.extend(results)

        # Remove duplicates
        unique_results = {}

        for item in all_results:
            key = (item["document_id"], item["text"])
            if key not in unique_results:
                unique_results[key] = item

        vector_results = list(unique_results.values())

        if not vector_results:
            return []

        # BM25 re-ranks by keyword relevance and returns the top results.
        # The CrossEncoder reranker was removed — it added 15-25s of CPU
        # latency on code chunks for marginal quality gain.
        bm25_results = BM25Service.search(
            query=query,
            documents=vector_results,
            limit=limit
        )

        return bm25_results
    
    
    
    