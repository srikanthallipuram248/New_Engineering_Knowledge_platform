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
        limit: int = 5,
        filters: dict = None,
        uploaded_by: int = None
    ):
        
        # vector_results = SearchService.search(
        #     query=query,
        #     #limit=limit
        #     limit=20,
        #     filters=filters
        # )

        #New for QueryExpantationService
        expanded_queries = QueryExpansionService.expand(
            query
        )

        all_results = []

        for q in expanded_queries:

            results = SearchService.search(
                query=q,
                limit=50,
                filters=filters,
                uploaded_by=uploaded_by
            )

            all_results.extend(results)
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

        bm25_results = BM25Service.search(
            query=query,
            documents=vector_results,
            limit=limit
        )

        # print(
        #     f"Vector={len(vector_results)} "
        #     f"BM25={len(bm25_results)}"
        # )

        #return vector_results
        #return bm25_results

        reranked = RerankerService.rerank(
            query=query,
            results=bm25_results,
            top_k=10
        )

        print("VECTOR RESULTS =", len(vector_results))
        print("BM25 RESULTS =", len(bm25_results))
        print("RERANK RESULTS =", len(reranked))

        return reranked[:5]
        





