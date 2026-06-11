class LLMService:

    @staticmethod
    def generate(
        question: str,
        context: str
    ):

        return f"""
Context:
{context}

Question:
{question}

Answer:
This answer was generated using the retrieved document context.
"""