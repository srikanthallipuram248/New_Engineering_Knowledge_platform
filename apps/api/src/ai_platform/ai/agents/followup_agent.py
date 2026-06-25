from groq import Groq

from src.core.config import settings

from src.ai_platform.ai.prompts.analyze_prompt import (
    FOLLOWUP_SYSTEM_PROMPT
)


class FollowupAgent:

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    @classmethod
    def resolve(
        cls,
        question: str,
        history=None,
        memory=None
    ):

        if not history:
            return question

        recent_history = []

        for msg in history[-6:]:

            try:

                recent_history.append(
                    {
                        "role": msg.role,
                        "content": msg.content
                    }
                )

            except Exception:
                pass

        messages = [
            {
                "role": "system",
                "content": FOLLOWUP_SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": f"""
        Current Question:

        {question}

        Conversation History:

        {recent_history}

        Working Memory:

        {memory}
        """
            }
        ]

        try:

            response = cls.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                temperature=0,
                response_format={
                    "type": "text"
                },
                messages=messages
            )

            rewritten_question = (
                response
                .choices[0]
                .message
                .content
                .strip()
            )

            print("=" * 80)
            print("FOLLOWUP AGENT")
            print("ORIGINAL QUESTION =", question)
            print(
                "REWRITTEN QUESTION =",
                rewritten_question
            )
            print("=" * 80)

            return rewritten_question

        except Exception as e:

            print(
                f"FollowupAgent Error: {e}"
            )

            return question