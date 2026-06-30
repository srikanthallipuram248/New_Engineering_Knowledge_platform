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

        # all-MiniLM-L6-v2 cosine scores for relevant content typically sit
        # in the 0.3-0.6 range, so 0.45 was dropping valid matches (especially
        # prose/PDF chunks). BM25 re-ranks afterward, so a lower gate is safe.
        vector_results = [
            r
            for r in vector_results
            if r.get("score", 0) > 0.3
        ]

        query_lower = query.lower()

        for r in vector_results:

            text = r["text"].lower()

            if query_lower in text:
                r["score"] += 1.0
        
        print("=" * 80)
        print("VECTOR RESULTS =", len(vector_results))

        for r in vector_results[:10]:
            print(
                r.get("filename"),
                r.get("score"),
                r.get("text", "")[:200]
            )

        if not vector_results:
            return []

        # BM25 re-ranks by keyword relevance and returns the top results.
        # The CrossEncoder reranker was removed — it added 15-25s of CPU
        # latency on code chunks for marginal quality gain.
        bm25_results = BM25Service.search(
            query=query,
            documents=vector_results,
            limit=50
        )

        print("=" * 80)
        print("BM25 RESULTS =", len(bm25_results))

        for r in bm25_results[:10]:
            print(
                r.get("filename"),
                r.get("bm25_score")
            )

        if not bm25_results:
            return []

        return bm25_results[:limit]
    
    
    
    