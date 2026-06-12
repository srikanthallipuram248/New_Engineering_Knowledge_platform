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
        user
    ):
        history = ChatHistoryService.get_recent(
            db=db,
            user_id=user.id,
            limit=10
        )

        #update graph
        graph = build_chat_graph()

        # return RAGService.ask(
        #     question=question,
        #     history=history
        # )

        #New graph code
        print("USER ID =", user.id)
        result = graph.invoke(
            {
                "question": question,
                "history": history,
                "uploaded_by": user.id
            }
        )

        print("GRAPH RESULT =", result)
        #return result["answer"]

        #New
        # return {
        #     "answer": result["answer"],
        #     "sources": result.get("sources", [])
        # }

        seen = set()
        sources = []
        
        for s in result.get("sources", []):
            key = s["document_id"]
            
            if key in seen:
                continue
            
            seen.add(key)
            
            sources.append(
                {
                    "document_id": s["document_id"],
                    "filename": s["filename"],
                    "rerank_score": s.get("rerank_score", 0),
                    "snippet": s.get("text", "")[:500]
                }
            )

        return {
            "answer": result["answer"],
            "sources": sources
        }
    
    
    
    
    