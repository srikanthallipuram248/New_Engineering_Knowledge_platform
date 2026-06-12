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

        print("\n===== GROQ =====")
        print("QUESTION =", question)
        print("CONTEXT LENGTH =", len(context))

        if context:
            print("CONTEXT PREVIEW:")
            print(context[:1000])
        else:
            print("CONTEXT IS EMPTY")

        print("================\n")

        messages = [
            {
                "role": "system",
                "content": DOCUMENT_QA_SYSTEM_PROMPT
            }
        ]

        # History
        if history:
            for msg in history[-10:]:
                messages.append(
                    {
                        "role": msg.role,
                        "content": msg.content
                    }
                )
        # Single user message containing both context and question

        messages.append(
            {
                "role": "user",
                "content": f"""
        CONTEXT:

        {context}

        QUESTION:

        {question}

        Instructions:
        - Answer ONLY using the context.
        - Give a concise answer first.
        - If available, include relevant supporting details.
        - If the answer is not present in the context, reply exactly:

        I don't know based on the uploaded documents.
        """
            }
        )

        response = cls.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.1
        )


        return response.choices[0].message.content
    
    