from sentence_transformers import SentenceTransformer


class EmbeddingsService:
    
    model = SentenceTransformer(
        "BAAI/bge-base-en-v1.5"
    )
        
    @classmethod
    def generate(
        cls, 
        text: str
    ):
        return cls.model.encode(
            text
        ).tolist()
        
    

    def generate_embedding(
        self,
        text: str
    ):
        return self.model.encode(text).tolist()



    def generate_embeddings(
        self,
        texts: list[str]
    ):
        return self.model.encode(texts).tolist()


    