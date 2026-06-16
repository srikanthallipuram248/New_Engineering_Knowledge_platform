from groq import Groq

from src.core.config import settings

from src.ai_platform.ai.prompts.system_promts import (
    DOCUMENT_QA_SYSTEM_PROMPT
)


class GroqService:

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    @classmethod
    def generate(
        cls,
        question: str,
        context: str,
        history=None
    ):

        if not context.strip():

            return (
                "I don't know based on the uploaded documents."
            )

        messages = [
            {
                "role": "system",
                "content": DOCUMENT_QA_SYSTEM_PROMPT
            }
        ]

        messages.append(
            {
                "role": "user",
                "content": f"""
CONTEXT:

{context}

QUESTION:

{question}
"""
            }
        )

        response = cls.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.0,
            max_tokens=1000
        )

        answer = (
            response
            .choices[0]
            .message
            .content
            .strip()
        )

        return answer
    
    
    
    
    