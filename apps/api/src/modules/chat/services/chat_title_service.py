class ChatTitleService:

    @staticmethod
    def generate(
        question: str
    ) -> str:
        
        if not question:
            return "New Chat"
        
        words = question.strip().split()

        return " ".join(words[:6]).title()