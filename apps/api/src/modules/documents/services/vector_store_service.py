from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    #NEW
    Filter,
    FieldCondition,
    MatchValue
)



class VectorStoreService:

    def __init__(self):
        self.client = QdrantClient(
            host="qdrant",
            port=6333
        )

    def create_collection(self):

        collections = self.client.get_collections()

        names = [
            c.name
            for c in collections.collections
        ]

        if "documents" not in names:

            self.client.create_collection(
                collection_name="documents",
                vectors_config=VectorParams(
                    size=384,
                    distance=Distance.COSINE
                )
            )


    def insert_chunk(
        self,
        chunk_id,
        document_id,
        filename,
        text,
        embedding
    ):
        self.client.upsert(
            collection_name="documents",
            points=[
                PointStruct(
                    id=chunk_id,
                    vector=embedding,
                    payload={
                        "document_id": document_id,
                        "filename": filename,
                        "text": text
                    }
                )
            ]
        )
        
    # for search
    def search(
        self,
        embedding,
        limit=5,
        score_threshold=0.0,
        #New
        filters=None
    ):

        # results = self.client.search(
        #     collection_name="documents",
        #     query_vector=embedding,
        #     limit=limit
        #     #score_threshold=score_threshold
        # )

        # return [
        #     {
        #         "score": result.score,
        #         "text": result.payload.get("text", ""),
        #         "document_id": result.payload.get("document_id"),
        #         "filename": result.payload.get("filename")
        #     }
        #     for result in results
        # ]


        #New
        qdrant_filter = None
        if filters and filters.get("filename"):

            qdrant_filter = Filter(
                must=[
                    FieldCondition(
                        key="filename",
                        match=MatchValue(
                            value=filters["filename"]
                        )
                    )
                ]
            )

        results = self.client.search(
            collection_name="documents",
            query_vector=embedding,
            limit=limit,
            query_filter=qdrant_filter
        )
        return [
            {
                "score": result.score,
                "text": result.payload.get(
                    "text",
                    ""
                ),
                "document_id": result.payload.get(
                    "document_id"
                ),
                "filename": result.payload.get(
                    "filename"
                )
            }
            for result in results
        ]
