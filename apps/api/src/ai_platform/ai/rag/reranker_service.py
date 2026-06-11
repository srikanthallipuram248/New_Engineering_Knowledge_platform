class RerankerService:

    @staticmethod
    def rerank(
        query: str,
        results: list,
        top_k: int = 5
    ):
        
        return results[:top_k]