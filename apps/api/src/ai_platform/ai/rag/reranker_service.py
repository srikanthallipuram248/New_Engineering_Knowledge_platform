from sentence_transformers import CrossEncoder


class RerankerService:

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

        for result, score in zip(results, scores):
            result["rerank_score"] = float(score)

        print("=" * 80)
        print("RERANK SCORES")
        print("=" * 80)

        for r in results[:10]:
            print(
                r.get("filename"),
                r.get("rerank_score")
            )

        ranked = sorted(
            results,
            key=lambda x: x["rerank_score"],
            reverse=True
        )

        return ranked[:top_k]
    
    