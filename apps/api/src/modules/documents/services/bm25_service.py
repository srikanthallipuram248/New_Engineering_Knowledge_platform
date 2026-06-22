from rank_bm25 import BM25Okapi
import re

class BM25Service:

    @staticmethod
    def search(
        query: str,
        documents: list,
        limit: int = 50
    ):

        if not documents:
            return []

        
        

        corpus = [
            re.findall(
                r"\w+",
                doc["text"].lower()
            )
            for doc in documents
        ]

        bm25 = BM25Okapi(corpus)

        query_tokens = re.findall(
            r"\w+",
            query.lower()
        )

        scores = bm25.get_scores(
            query_tokens
        )

        ranked = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True
        )

        results = []

        for doc, score in ranked[:limit]:

            results.append(
                {
                    "score": float(score),
                    "bm25_score": float(score),
                    "text": doc["text"],
                    "document_id": doc["document_id"],
                    "filename": doc.get("filename"),
                    "uploaded_by": doc.get("uploaded_by"),
                    "uploaded_by_name": doc.get(
                        "uploaded_by_name"
                    )
                }
            )

        return results
    

    