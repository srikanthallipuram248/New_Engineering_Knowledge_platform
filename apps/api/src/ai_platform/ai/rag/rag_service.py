from src.modules.documents.services.search_service import (
    SearchService
)

from src.ai_platform.ai.llms.llm_service import(
    LLMService
)
from src.ai_platform.ai.prompts.rag_prompt import (
    RAG_PROMPT
 )
 
from src.ai_platform.ai.llms.groq_service import (
    GroqService
)

#new update code for analyze service agent
from src.ai_platform.ai.agents.analyze_agent import (
    AnalyzeAgent
)

#Hybrid search
from src.ai_platform.ai.rag.hybrid_search_service import (
    HybridSearchService
)

 


class RAGService:

    #Now:
    #question → analyze → rewrite → better search → better answer

    @staticmethod
    def ask(
        question: str,
        history: list = None,
        uploaded_by: int = None
    ):
        # 1. ANALYZE STEP (NEW)
        analysis = AnalyzeAgent.analyze(
            question,
            history
        )

        rewritten_question = analysis["rewritten_question"]


        # 2 Hybrid search using improved query
        # results = SearchService.search(
        #     query=rewritten_question,
        #     limit=5
        # )

        #New
        results = HybridSearchService.search(
            query=rewritten_question,
            filters=analysis.get("filters", {}),
            limit=5,
            uploaded_by=uploaded_by
        )

        # 3 Build context
        context = "\n\n".join(
            f"[DOC {i+1}]\n{r['text']}"
            for i, r in enumerate(results)
        )

        # 4 Final LLM call

        answer = GroqService.generate(
            question=rewritten_question,
            context=context,
            history=history
        )

        return answer
    


    # ---------------
    # Retrieve
    # ---------------
    @staticmethod
    def retrieve(
        question: str,
        history: list = None,
        uploaded_by: int = None
    ):
        
        analysis = AnalyzeAgent.analyze(
            question,
            history
        )

        rewritten_question = analysis["rewritten_question"]

        # results = SearchService.search(
        #     query=rewritten_question,
        #     limit=5
        # )

        #New
        results = HybridSearchService.search(
            query=rewritten_question,
            filters=analysis.get("filters", {}),
            limit=5,
            uploaded_by=uploaded_by
        )

        context = "\n\n".join(
            f"[DOC {i+1}]\n{r['text']}"
            for i, r in enumerate(results)
        )

        return {
            "rewritten_question": rewritten_question,
            "context": context,
            "results": results
        }




    
    #
    # Before:
    # direct question → search → answer
    # @staticmethod
    # def ask(
    #     question: str,
    #     history: list = None
    # ):
        
    #     results = SearchService.search(
    #         query = question,
    #         limit = 5
    #     )
        
    #     # context = "\n\n".join(
    #     #     [r["text"] for r in results]
    #     # )
        
    #     context = "\n\n".join(
    #         f"[DOC {i+1}]\n{r['text']}"
    #         for i, r in enumerate(results)
    #     )

    #     # prompt = RAG_PROMPT.format(
    #     #     context = context,
    #     #     question = question
    #     # )
        
    #     answer = GroqService.generate(
    #         question=question,
    #         context=context,
    #         history = history
    #     )
        
    #     return answer












