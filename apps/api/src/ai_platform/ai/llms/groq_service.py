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

        messages = [
            {
                "role": "system",
                "content": DOCUMENT_QA_SYSTEM_PROMPT
            }
        ]

        # Optional chat history
        if history:
            for msg in history[-10:]:
                messages.append(
                    {
                        "role": msg.role,
                        "content": msg.content
                    }
                )

        # Document context
        messages.append(
            {
                "role": "system",
                "content": f"""
CONTEXT:

{context}

Answer ONLY from this context.
If the answer is not present, say:

I don't know based on the uploaded documents.
"""
            }
        )

        # User question
        messages.append(
            {
                "role": "user",
                "content": question
            }
        )

        response = cls.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.1
        )

        return response.choices[0].message.content
    
    