import json

from groq import Groq

from src.core.config import settings

from src.ai_platform.ai.prompts.analyze_prompt import (
    ANALYZE_SYSTEM_PROMPT
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
                "content": ANALYZE_SYSTEM_PROMPT
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

            content = (
                response
                .choices[0]
                .message
                .content
                .strip()
            )

            # ANALYZE_SYSTEM_PROMPT makes the model reply with JSON, so pull
            # the actual standalone question out of it. Fall back to the raw
            # text (then the original question) if it isn't valid JSON.
            rewritten_question = question

            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            try:
                parsed = json.loads(content)
                rewritten_question = parsed.get(
                    "rewritten_question", question
                ) or question
            except (json.JSONDecodeError, AttributeError):
                # Not JSON — treat the plain text as the question if it looks
                # like a sentence, otherwise keep the original.
                if content and "{" not in content:
                    rewritten_question = content

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