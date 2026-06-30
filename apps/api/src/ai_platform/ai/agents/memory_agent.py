from groq import Groq
import json

from src.core.config import settings
from src.ai_platform.ai.prompts.system_promts import (
    MEMORY_SYSTEM_PROMPT
)


class MemoryAgent:

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    @classmethod
    def build(
        cls,
        history=None
    ):

        if not history:
            return {}

        conversation = []

        for msg in history[-10:]:

            conversation.append(
                {
                    "role": msg.role,
                    "content": msg.content
                }
            )

        try:

            response = cls.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                temperature=0,
                response_format={
                    "type": "json_object"
                },
                messages=[
                    {
                        "role": "system",
                        "content": MEMORY_SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            conversation,
                            ensure_ascii=False
                        )
                    }
                ]
            )

            memory = json.loads(
                response.choices[0].message.content
            )

            print("=" * 80)
            print("WORKING MEMORY")
            print(
                json.dumps(
                    memory,
                    indent=2
                )
            )
            print("=" * 80)

            return memory

        except Exception as e:

            print(
                f"MemoryAgent Error: {e}"
            )

            return {}