import json
from groq import Groq

from src.core.config import settings

from src.ai_platform.ai.prompts.system_promts import DOCUMENT_QA_SYSTEM_PROMPT

from typing import Generator


class GroqService:

    MODEL = "llama-3.3-70b-versatile"

    client = Groq(api_key=settings.GROQ_API_KEY)

    @classmethod
    def generate(
        cls,
        question: str,
        context: str,
        history=None,
        memory=None,
    ):

        if not context.strip():
            return "I couldn't find relevant information " "in the uploaded documents."

        messages = cls._build_messages(
            question=question,
            context=context,
            history=history,
            memory=memory,
        )

        response = cls.client.chat.completions.create(
            model=cls.MODEL, messages=messages, temperature=0, max_tokens=1000
        )

        return response.choices[0].message.content.strip()

    # ----------------------
    # Private helper
    # --------------------
    @classmethod
    def _build_messages(
        cls,
        question: str,
        context: str,
        history=None,
        memory=None,
    ):
        messages = [
            {
                "role": "system",
                "content": DOCUMENT_QA_SYSTEM_PROMPT,
            }
        ]

        # Working Memory
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
    """,
                }
            )

        # Conversation History
        if history:
            for msg in history[-10:]:
                role = msg.role if hasattr(msg, "role") else msg.get("role", "user")

                content = (
                    msg.content if hasattr(msg, "content") else msg.get("content", "")
                )

                if role in ("user", "assistant") and content:
                    messages.append(
                        {
                            "role": role,
                            "content": content,
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

    IMPORTANT:

    Answer ONLY using the provided context.

    If the answer cannot be found in the context,
    say that you could not find the information.

    Do not use outside knowledge.

    Never guess.

    Never fabricate.
    """,
            }
        )

        return messages

    # ----------------------------
    # Streaming generator
    # -----------------------------

    @classmethod
    def stream_generate(
        cls,
        question: str,
        context: str,
        history=None,
        memory=None,
    ) -> Generator[str, None, None]:

        if not context.strip():
            yield ("I couldn't find relevant information " "in the uploaded documents.")
            return

        messages = cls._build_messages(
            question=question,
            context=context,
            history=history,
            memory=memory,
        )

        stream = cls.client.chat.completions.create(
            model=cls.MODEL,
            messages=messages,
            temperature=0,
            max_tokens=1000,
            stream=True,
        )

        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
