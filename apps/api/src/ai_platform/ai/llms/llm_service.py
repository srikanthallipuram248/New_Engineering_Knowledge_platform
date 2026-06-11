class LLMService:
    
    @staticmethod
    def generate_answer(
        question: str,
        context: str
    ):
        return f"""
Question:
{question}

Based on retrieved documents:

{context[:1000]}
"""