from groq import Groq

from src.core.config import settings

from src.ai_platform.ai.prompts.system_promts import (
    DOCUMENT_QA_SYSTEM_PROMPT
)


class GroqService:

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    MAX_CONTEXT_CHARS = 25000

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

        context = context[:cls.MAX_CONTEXT_CHARS]

        messages = [
            {
                "role": "system",
                "content": DOCUMENT_QA_SYSTEM_PROMPT
            }
        ]

        # Add conversation history
        if history:

            history = history[-10:]

            for msg in history:

                messages.append(
                    {
                        "role": msg.role,
                        "content": msg.content
                    }
                )

        messages.append(
            {
                "role": "user",
                "content": f"""
        QUESTION:
        {question}

        CONTEXT:
        {context}
        """
            }
        )

        try:

            response = cls.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0,
                max_tokens=1000
            )

            return (
                response
                .choices[0]
                .message
                .content
                .strip()
            )

        except Exception as e:

            print(
                f"Groq Error: {e}"
            )

            return (
                "I encountered an error while generating the response."
            )