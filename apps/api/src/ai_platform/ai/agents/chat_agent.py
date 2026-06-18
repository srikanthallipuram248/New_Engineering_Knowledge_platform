from src.ai_platform.ai.llms.groq_service import (
    GroqService
)


class ChatAgent:

    @staticmethod
    def answer(
        question,
        context,
        history=None
    ):

        return GroqService.generate(
            question=question,
            context=context,
            history=history
        )