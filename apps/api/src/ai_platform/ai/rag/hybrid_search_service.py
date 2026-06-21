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
        limit: int = 50,
        filters: dict = None
    ):

        expanded_queries = [query]

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

        vector_results = [
            r
            for r in vector_results
            if r.get("score", 0) > 0.45
        ]

        query_lower = query.lower()

        for r in vector_results:

            text = r["text"].lower()

            if query_lower in text:
                r["score"] += 2.0

        if not query.strip():
            return []


        for r in vector_results[:10]:
            print(
                r.get("filename"),
                r.get("score"),
                r.get("text", "")[:200]
            )

        if not vector_results:
            return []

        bm25_results = BM25Service.search(
            query=query,
            documents=vector_results,
            limit=50
        )

        for r in bm25_results[:10]:
            print(
                r.get("filename"),
                r.get("bm25_score")
            )

        if not bm25_results:
            return []

        reranked = RerankerService.rerank(
            query=query,
            results=bm25_results,
            top_k=min(limit, 20)
        )

        for r in reranked[:10]:
            print(
                r.get("filename"),
                r.get("rerank_score")
            )

        if not reranked:
            return []

        return reranked
    
    
    
    