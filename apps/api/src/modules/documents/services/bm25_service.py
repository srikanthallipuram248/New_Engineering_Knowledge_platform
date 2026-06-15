from rank_bm25 import BM25Okapi


class BM25Service:

    @staticmethod
    def search(
        query: str,
        documents: list,
        limit: int = 5
    ):

        if not documents:
            return []

        corpus = [
            doc["text"].split()
            for doc in documents
        ]

        bm25 = BM25Okapi(corpus)

        scores = bm25.get_scores(
            query.split()
        )

        ranked = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True
        )


        for doc, score in ranked[:10]:
            print(
                f"{doc.get('filename')} | "
                f"doc={doc.get('document_id')} | "
                f"score={float(score)}"
            )

        results = []

        for doc, score in ranked[:limit]:

            results.append(
                {
                    "score": float(score),
                    "text": doc["text"],
                    "document_id": doc["document_id"],
                    "filename": doc.get("filename"),
                    "uploaded_by": doc.get(
                        "uploaded_by"
                    ),
                    "uploaded_by_name": doc.get(
                        "uploaded_by_name"
                    )
                }
            )
            
        # OR
        # for doc, score in ranked[:limit]:

        #     item = doc.copy()

        #     item["score"] = float(score)

        #     results.append(item)
        
        

        return results