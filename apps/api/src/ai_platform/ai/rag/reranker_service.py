from sentence_transformers import CrossEncoder


class RerankerService:

    # @staticmethod
    # def rerank(
    #     query: str,
    #     results: list,
    #     top_k: int = 5
    # ):
        
    #     return results[:top_k]

    model = CrossEncoder(
        "cross-encoder/ms-marco-MiniLM-L-6-v2"
    )

    @classmethod
    def rerank(
        cls,
        query,
        results,
        top_k=5
    ):

        if not results:
            return []

        pairs = [
            (query, r["text"])
            for r in results
        ]

        scores = cls.model.predict(pairs)

        for result, score in zip(results, scores):
            result["rerank_score"] = float(score)

        ranked = sorted(
            results,
            key=lambda x: x["rerank_score"] > -9,
            reverse=True
        )

        print("\n===== RERANK SCORES =====")

        for r in ranked:
            print(
                r["filename"],
                r["rerank_score"]
            )

        print("=========================\n")
        return ranked[:top_k]






