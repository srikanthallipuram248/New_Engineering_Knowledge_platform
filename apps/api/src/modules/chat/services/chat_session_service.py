from src.modules.chat.models.chat_session import ChatSession

class ChatSessionService:

    @staticmethod
    def create(
        db,
        user_id,
        title
    ):
        
        session = ChatSession(
            user_id=user_id,
            title=title
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return session
    
# --------------------------
# Sessions get list
# --------------------------

    @staticmethod
    def list_sessions(
        db,
        user_id
    ):
        
        return (
            db.query(ChatSession)
            .filter(
                ChatSession.user_id == user_id
            )
            .order_by(
                ChatSession.id.desc()
            )
            .all()
        )






