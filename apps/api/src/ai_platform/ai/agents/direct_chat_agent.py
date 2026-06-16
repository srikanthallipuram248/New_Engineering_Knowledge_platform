from groq import Groq

from src.core.config import settings


class DirectChatAgent:

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    @classmethod
    def answer(
        cls,
        question: str
    ):
        response = cls.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful AI assistant. "
                        "Answer naturally and conversationally. "
                        "Do not mention uploaded documents "
                        "unless the user asks about them."
                    )
                },
                {
                    "role": "user",
                    "content": question
                }
            ],
            temperature=0.3
        )

        return (
            response
            .choices[0]
            .message
            .content
        )