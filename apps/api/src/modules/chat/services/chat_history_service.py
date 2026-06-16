from src.modules.chat.models.chat_history import (
    ChatHistory
)

from src.modules.chat.models.chat_message import (
    ChatMessage
)


class ChatHistoryService:

    @staticmethod
    def save(
        db,
        user_id,
        role,
        content
    ):
    
        
        message = ChatMessage(
            user_id = user_id,
            role = role,
            content = content
        )

        db.add(message)

        db.commit()
        return message

    @staticmethod
    def get_recent(
        db,
        user_id,
        limit = 10
    ):
        return (
            db.query(ChatMessage)
            .filter(
                ChatMessage.user_id == user_id
            )
            .order_by(
                ChatMessage.id.desc()
            )
            .limit(limit)
            .all()
        )








