from groq import Groq
from src.core.config import settings


class GroqService:

    client = Groq(api_key=settings.GROQ_API_KEY)

    @classmethod
    def generate(cls, question: str, context: str, history=None):

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an Engineering Knowledge Assistant.\n"
                    "Use ONLY the provided context and chat history.\n"
                    "If the answer is not in context, say you don't know."
                )
            }
        ]

        # Add history (FIXED)
        if history:
            for msg in history[-10:]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        # Add context properly
        messages.append({
            "role": "system",
            "content": f"Context:\n{context}"
        })

        # Add question (IMPORTANT FIX)
        messages.append({
            "role": "user",
            "content": question
        })

        response = cls.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.3
        )

        return response.choices[0].message.content