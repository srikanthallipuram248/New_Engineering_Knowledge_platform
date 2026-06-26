import json
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
        history=None,
        memory=None
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

        # -----------------------------
        # Working Memory
        # -----------------------------
        if memory:

            messages.append(
                {
                    "role": "system",
                    "content": f"""
    Working Memory

    The following JSON is conversational context.

    Use it only to resolve references,
    pronouns,
    follow-up questions,
    and conversational state.

    Do not use it as factual evidence.

    {json.dumps(memory, indent=2, default=str)}
    """
                }
            )

        # -----------------------------
        # Conversation History
        # -----------------------------
        if history:

            for msg in history[-10:]:

                role = (
                    msg.role
                    if hasattr(msg, "role")
                    else msg.get("role", "user")
                )

                content = (
                    msg.content
                    if hasattr(msg, "content")
                    else msg.get("content", "")
                )

                if (
                    role in ("user", "assistant")
                    and content
                ):
                    messages.append(
                        {
                            "role": role,
                            "content": content
                        }
                    )

        # -----------------------------
        # Current Question
        # -----------------------------
        messages.append(
            {
                "role": "user",
                "content": f"""
    QUESTION:
    {question}

    CONTEXT:
    {context}

    IMPORTANT:

    Answer ONLY using the provided context.

    If the answer cannot be found in the context,
    say that you could not find the information.

    For structured data such as tables,
    Excel,
    CSV,
    JSON,
    or reports:

    - Count rows when asked.
    - Calculate totals when requested.
    - Calculate averages when requested.
    - Find highest and lowest values.
    - Compare records when requested.
    - Summarize information when requested.

    Do not invent information.

    Do not use outside knowledge if the answer is expected from the uploaded documents.
    """
            }
        )

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
    
    
    
    
