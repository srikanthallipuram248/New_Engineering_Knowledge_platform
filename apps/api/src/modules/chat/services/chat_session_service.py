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
    def get_all(
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


    # ---------------------
    # Get by ID
    # ---------------------

    @staticmethod
    def get_by_uuid(
        db,
        session_uuid,
        user_id
    ):
        
        return (
            db.query(ChatSession)
            .filter(
                ChatSession.session_uuid == session_uuid,
                ChatSession.user_id == user_id
            )
            .first()
        )
        



    # ------------------
    # Delete
    # --------------------

    @staticmethod
    def session_delete(
        db,
        session_id,
        user_id
    ):
        
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.session_uuid == session_id,
                ChatSession.user_id == user_id
            )
            .first()
        )
        # Optional
        # session = ChatSessionService.get_by_uuid(
        #     db=db,
        #     session_uuid=session_uuid,
        #     user_id=user_id
        # )
        
        if not session:
            return False
        
        db.delete(session)
        db.commit()
        
        return True
    

    # -------------------
    # Update title
    # --------------------

    @staticmethod
    def update_title(
        db,
        session_id,
        user_id,
        title
    ):
        
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.session_uuid == session_id,
                ChatSession.user_id == user_id
            )
            .first()
        )

        if not session:
            return None
        
        session.title = title

        db.commit()
        db.refresh(session)

        return session

    # ----------------------
    # get session messages (supporter)
    #------------------------

    @staticmethod
    def get_internal_session_id(
        db,
        session_uuid,
        user_id
    ):

        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.session_uuid == session_uuid,
                ChatSession.user_id == user_id
            )
            .first()
        )

        if not session:
            return None

        return session.id 



