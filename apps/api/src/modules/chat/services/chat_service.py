import json
from src.modules.chat.services.chat_history_service import (
    ChatHistoryService
)


from src.ai_platform.ai.workflows.graph.chat_graph import (
    build_chat_graph
)

from src.ai_platform.ai.agents.memory_agent import (
    MemoryAgent
)


class ChatService:
    
    # for get code method if answer in code related
    @staticmethod
    def contains_code(
        text: str
    ) -> bool:
        
        patterns = [
             "def ",
            "class ",
            "import ",
            "from ",
            "return ",
            "public class",
            "private ",
            "protected ",
            "function ",
            "const ",
            "let ",
            "var ",
            "#include",
            "package ",
            "@Override"
        ]

        matches = sum(
            1
            for p in patterns
            if p in text
        )

        return matches >= 2
    

    @staticmethod
    def user_wants_code(
        question: str
    ) -> bool:
        
        question = question.lower()

        keywords = [
            "code",
            "source code",
            "implementation",
            "function",
            "method",
            "class",
            "service",
            "api",
            "repository"
        ]

        return any(
            keyword in question
            for keyword in keywords
        )

    @staticmethod
    def ask(
        question,
        db,
        session_id,
        user,
        document_ids=None
    ):
        history = ChatHistoryService.get_recent(
            db=db,
            session_id=session_id,
            user_id=user.id,
            limit=10
        )
        
        #Memory agent
        memory = MemoryAgent.build(
            question=question,
            history=history
        )

        graph = build_chat_graph()
        print("=" * 80)
        print("WORKING MEMORY")
        print(json.dumps(
            memory,
            indent=2,
            default=str
        ))
        print("=" * 80)

        result = graph.invoke(
            {
                "question": question,
                "history": history,
                # memory
                "memory": memory,
                "db": db,
                "user_id": user.id,
                "uploaded_by": user.id,
                "document_ids": document_ids or []
            }
        )

        seen = set()
        sources = []

        # for code answer
        show_code = ChatService.user_wants_code(
            question
        )
        
        for s in result.get("sources", []):

            key = s["document_id"]

            if key in seen:
                continue

            seen.add(key)

            source = {
                "document_id": s["document_id"],
                "filename": s["filename"],
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

            if (
                show_code
                and ChatService.contains_code(
                    s.get("text", "")
                )
            ):
                source["code"] = s.get(
                    "text",
                    ""
                )

            sources.append(source)
        
        

        # return {
        #     "answer": result["answer"],
        #     "sources": sources
        # }
        return {
            "answer": result.get(
                "answer",
                ""
            ),

            "sources": sources,

            "intent": result.get(
                "intent",
                "rag"
            ),

            "action": result.get(
                "action",
                "rag"
            )
        }
    
    
    
    
    