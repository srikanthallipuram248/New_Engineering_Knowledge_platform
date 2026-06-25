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

        # Inject conversation history so the LLM can refer back to
        # previous messages in the same session.
        if history:
            for msg in history:
                role = msg.role if hasattr(msg, "role") else msg.get("role", "user")
                content = msg.content if hasattr(msg, "content") else msg.get("content", "")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append(
            {
                "role": "user",
                "content": f"""
QUESTION:
{question}

CONTEXT:
{context}

IMPORTANT:

If the answer exists in the context,
answer ONLY from context.

For tables, excel sheets,
csv files and structured data:

- Count rows if user asks count
- Calculate totals if user asks total
- Calculate averages if user asks average
- Use only context data

Never say you don't know if
the required information exists
in the provided context.
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
    
    
    
    
    