from src.modules.chat.models.chat_message import (
    ChatMessage
)

class ChatHistoryService:

    @staticmethod
    def save(
        db,
        session_id,
        user_id,
        role,
        content
    ):
    
        
        message = ChatMessage(
            session_id=session_id,
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
        session_id,
        user_id,
        limit=10
    ):

        messages = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.user_id == user_id,
                ChatMessage.session_id == session_id
            )
            .order_by(
                ChatMessage.id.desc()
            )
            .limit(limit)
            .all()
        )

        return list(reversed(messages))

    # --------------------
    # Get Session messages
    # --------------------

    @staticmethod
    def get_session_messages(
        db,
        session_id
    ):
        
        return (
            db.query(ChatMessage)
            .filter(
                ChatMessage.session_id == session_id
            )
            .order_by(
                ChatMessage.id.asc()
            )
            .all()
        )





