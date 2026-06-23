from src.modules.chat.services.chat_history_service import (
    ChatHistoryService
)

from src.ai_platform.ai.workflows.graph.chat_graph import (
    build_chat_graph
)


class ChatService:

    @staticmethod
    def ask(
        question,
        db,
        session_id,
        user
    ):

        history = ChatHistoryService.get_recent(
            db=db,
            session_id=session_id,
            user_id=user.id,
            limit=10
        )

        graph = build_chat_graph()

        result = graph.invoke(
            {
                "question": question,
                "history": history,
                "uploaded_by": user.id,
                # for Adding metadata
                "db": db,
                "user": user
            }
        )

        print("=" * 80)
        print("GRAPH RESULT KEYS =", result.keys())
        print("ANSWER =", result.get("answer"))
        print("INTENT =", result.get("intent"))
        print("SOURCE COUNT =", len(result.get("sources", [])))
        print("=" * 80)

        seen = set()
        sources = []

        for s in result.get("sources", []):

            document_id = s.get(
                "document_id"
            )

            if document_id in seen:
                continue

            seen.add(document_id)

            sources.append(
                {
                    "document_id": document_id,
                    "filename": s.get(
                        "filename"
                    ),
                    "uploaded_by": s.get(
                        "uploaded_by"
                    ),
                    "uploaded_by_name": s.get(
                        "uploaded_by_name"
                    ),
                    "rerank_score": s.get(
                        "rerank_score",
                        0
                    ),
                    "snippet": s.get(
                        "text",
                        ""
                    )[:500]
                }
            )

        return {
            "answer": result.get(
                "answer",
                ""
            ),
            "sources": sources,
            "intent": result.get(
                "intent",
                "rag"
            )
        }