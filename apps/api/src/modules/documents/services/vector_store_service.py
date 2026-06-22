from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)


class VectorStoreService:

    COLLECTION_NAME = "documents"

    def __init__(self):
        self.client = QdrantClient(
            host="qdrant",
            port=6333
        )

        self.create_collection()

    def create_collection(self):

        collections = self.client.get_collections()

        collection_names = [
            collection.name
            for collection in collections.collections
        ]

        if self.COLLECTION_NAME not in collection_names:

            self.client.create_collection(
                collection_name=self.COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=768,
                    distance=Distance.COSINE
                )
            )

    def insert_chunk(
        self,
        chunk_id,
        document_id,
        filename,
        uploaded_by,
        uploaded_by_name,
        text,
        embedding
    ):

        payload = {
            "document_id": document_id,
            "filename": filename,
            "uploaded_by": uploaded_by,
            "uploaded_by_name": uploaded_by_name,
            "file_type": filename.split(".")[-1].lower(),
            "text": text,
            "text_length": len(text)
        }

        self.client.upsert(
            collection_name=self.COLLECTION_NAME,
            points=[
                PointStruct(
                    id=chunk_id,
                    vector=embedding,
                    payload=payload
                )
            ]
        )

    def search(
        self,
        embedding,
        limit=20,
        score_threshold=0.15,
        filters=None
    ):

        must_conditions = []

        if filters and filters.get("filename"):

            must_conditions.append(
                FieldCondition(
                    key="filename",
                    match=MatchValue(
                        value=filters["filename"]
                    )
                )
            )

        if filters and filters.get("file_type"):

            must_conditions.append(
                FieldCondition(
                    key="file_type",
                    match=MatchValue(
                        value=filters["file_type"]
                    )
                )
            )

        qdrant_filter = None

        if must_conditions:

            qdrant_filter = Filter(
                must=must_conditions
            )

        results = self.client.search(
            collection_name=self.COLLECTION_NAME,
            query_vector=embedding,
            limit=limit,
            score_threshold=score_threshold,
            query_filter=qdrant_filter
        )

        return [
            {
                "score": result.score,
                "text": result.payload.get("text", ""),
                "document_id": result.payload.get("document_id"),
                "filename": result.payload.get("filename"),
                "uploaded_by": result.payload.get("uploaded_by"),
                "uploaded_by_name": result.payload.get(
                    "uploaded_by_name"
                ),
                "file_type": result.payload.get(
                    "file_type"
                )
            }
            for result in results
        ]

    def delete_document_vectors(
        self,
        document_id
    ):

        self.client.delete(
            collection_name=self.COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(
                            value=document_id
                        )
                    )
                ]
            )
        )