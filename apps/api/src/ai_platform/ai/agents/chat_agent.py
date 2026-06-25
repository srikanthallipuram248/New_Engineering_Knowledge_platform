from src.ai_platform.ai.llms.groq_service import (
    GroqService
)

class ChatAgent:

    @staticmethod
    def answer(
<<<<<<< Updated upstream
        question: str,
        context: str,
        history = None
=======
        question,
        context,
        history=None,
        memory=None
>>>>>>> Stashed changes
    ):
        
        return GroqService.generate(
            question=question,
            context=context,
<<<<<<< Updated upstream
            history=history
        )



=======
            history=history,
            memory=memory
        )
>>>>>>> Stashed changes
