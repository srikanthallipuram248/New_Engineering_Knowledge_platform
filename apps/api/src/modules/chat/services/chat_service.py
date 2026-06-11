from src.modules.documents.services.search_service import (
    SearchService
)

from src.modules.chat.services.llm_service import (
    LLMService
)

from src.ai_platform.ai.rag.rag_service import (
    RAGService
)


from src.ai_platform.ai.rag.rag_service import (
    RAGService
)

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
        
        result = graph.invoke(
            {
                "question": question,
                "history": history
            }
        )

        #return result["answer"]

        #New
        # return {
        #     "answer": result["answer"],
        #     "sources": result.get("sources", [])
        # }

        sources = []
        for s in result.get("sources", []):
            sources.append(
                {
                    "document_id": s["document_id"],
                    "filename": s["filename"],
                    "rerank_score": s.get(
                        "rerank_score",
                        0
                    )
                }
            )

        return {
            "answer": result["answer"],
            "sources": sources
        }
    
    
    
    
    