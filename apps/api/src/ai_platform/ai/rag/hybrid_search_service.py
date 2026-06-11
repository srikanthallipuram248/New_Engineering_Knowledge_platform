from src.modules.documents.services.search_service import (
    SearchService
)

from src.modules.documents.services.bm25_service import (
    BM25Service
)

from src.ai_platform.ai.rag.reranker_service import (
    RerankerService
)



class HybridSearchService:

    @staticmethod
    def search(
        query: str,
        limit: int = 5,
        #New
        filters: dict = None
    ):
        
        vector_results = SearchService.search(
            query=query,
            #limit=limit
            limit=20,
            filters=filters
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

        return RerankerService.rerank(
            query=query,
            results=bm25_results,
            top_k=5
        )











