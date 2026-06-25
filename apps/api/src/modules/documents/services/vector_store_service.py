from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    MatchAny
)



class VectorStoreService:

    def __init__(self):
        self.client = QdrantClient(
            host="qdrant",
            port=6333,
            timeout=30
        )

        self.create_collection()

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
        uploaded_by,
        uploaded_by_name,
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
                        "uploaded_by": uploaded_by,
                        "uploaded_by_name": uploaded_by_name,
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
        filters=None
        #uploaded_by=None
    ):

        must_conditions = []

        # Note: "filename" in Qdrant payload is the repo/document name, NOT
        # the individual source file. Filtering by filename would incorrectly
        # block results when users ask about a specific file (e.g. chatController.js).
        # File names appear inside the chunk text, so vector + BM25 handles it naturally.

        # Scope search to specific document IDs if provided
        if filters and filters.get("document_ids"):
            must_conditions.append(
                FieldCondition(
                    key="document_id",
                    match=MatchAny(
                        any=filters["document_ids"]
                    )
                )
            )

        qdrant_filter = None

        if must_conditions:

            qdrant_filter = Filter(
                must=must_conditions
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
                "text": result.payload.get("text", ""),
                "document_id": result.payload.get("document_id"),
                "filename": result.payload.get("filename"),
                "uploaded_by": result.payload.get("uploaded_by"),
                "uploaded_by_name": result.payload.get(
                    "uploaded_by_name"
                )
            }
            for result in results
        ]

    #Delete method
    def delete_document_vectors(
        self,
        document_id
    ):
        self.client.delete(
            collection_name="documents",
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
