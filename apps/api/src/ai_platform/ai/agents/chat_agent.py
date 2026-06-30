from src.ai_platform.ai.llms.groq_service import (
    GroqService
)


class ChatAgent:

    @staticmethod
    def answer(
        question: str,
        context: str,
        history = None,
        memory=None
    ):

        return GroqService.generate(
            question=question,
            context=context,
            history=history,
            memory=memory
        )



