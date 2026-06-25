from sentence_transformers import CrossEncoder


class RerankerService:

    MIN_RERANK_SCORE = -10

    model = CrossEncoder(
        "cross-encoder/ms-marco-MiniLM-L-6-v2"
    )

    @classmethod
    def rerank(
        cls,
        query: str,
        results: list,
        top_k: int = 10
    ):

        if not results:
            return []

        pairs = [
            (query, r["text"])
            for r in results
        ]

        scores = cls.model.predict(
            pairs
        )

        for result, score in zip(
            results,
            scores
        ):
            result["rerank_score"] = float(score)

        ranked = sorted(
            results,
            key=lambda x: x["rerank_score"],
            reverse=True
        )

        filtered = [
            r 
            for r in ranked
            if r["rerank_score"] > cls.MIN_RERANK_SCORE
        ]

        return filtered[:top_k]
    
    
    