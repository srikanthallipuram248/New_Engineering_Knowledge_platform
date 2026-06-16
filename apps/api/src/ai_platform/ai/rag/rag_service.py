from src.ai_platform.ai.llms.groq_service import (
    GroqService
)

from src.ai_platform.ai.agents.analyze_agent import (
    AnalyzeAgent
)

from src.ai_platform.ai.rag.hybrid_search_service import (
    HybridSearchService
)


class RAGService:

    SEARCH_LIMIT = 15
    CONTEXT_LIMIT = 10
    MAX_CONTEXT_CHARS = 30000

    @staticmethod
    def build_context(results):

        top_results = results[
            :RAGService.CONTEXT_LIMIT
        ]

        context_parts = []

        for r in top_results:

            context_parts.append(
                f"""
FILENAME: {r['filename']}
DOCUMENT_ID: {r['document_id']}

CONTENT:
{r['text']}
"""
            )

        context = "\n\n".join(
            context_parts
        )

        return context[
            :RAGService.MAX_CONTEXT_CHARS
        ]

    @staticmethod
    def ask(
        question: str,
        history: list = None
        #uploaded_by: int = None
    ):

        analysis = AnalyzeAgent.analyze(
            question,
            history
        )

        rewritten_question = analysis[
            "rewritten_question"
        ]

        # results = HybridSearchService.search(
        #     query=rewritten_question,
        #     filters=analysis.get(
        #         "filters",
        #         {}
        #     ),
        #     limit=RAGService.SEARCH_LIMIT
        #     #uploaded_by=uploaded_by
        # )

        search_query = " ".join(
            analysis.get(
                "keywords",
                []
            )
        )

        if not search_query:
            search_query = rewritten_question

        print(
            "KEYWORDS =",
            analysis.get("keywords")
        )

        print(
            "SEARCH QUERY =",
            search_query
        )

        print(
            "KEYWORDS =",
            analysis.get("keywords")
        )

        print(
            "SEARCH QUERY =",
            search_query
        )

        results = HybridSearchService.search(
            query=search_query,
            filters=analysis.get(
                "filters",
                {}
            ),
            limit=RAGService.SEARCH_LIMIT
        )



        if not results:
            return (
                "I don't know based on "
                "the uploaded documents."
            )

        best_score = results[0].get(
            "rerank_score",
            0
        )

        if best_score < -5:
            return (
                "I don't know based on "
                "the uploaded documents."
            )

        context = RAGService.build_context(
            results
        )

        answer = GroqService.generate(
            question=rewritten_question,
            context=context,
            history=history
        )

        return answer

    @staticmethod
    def retrieve(
        question: str,
        history: list = None
        #uploaded_by: int = None
    ):

        analysis = AnalyzeAgent.analyze(
            question,
            history
        )

        rewritten_question = analysis[
            "rewritten_question"
        ]

        # results = HybridSearchService.search(
        #     query=rewritten_question,
        #     filters=analysis.get(
        #         "filters",
        #         {}
        #     ),
        #     limit=RAGService.SEARCH_LIMIT
        #     #uploaded_by=uploaded_by
        # )
        search_query = " ".join(
            analysis.get(
                "keywords",
                []
            )
        )

        if not search_query:
            search_query = rewritten_question

        results = HybridSearchService.search(
            query=search_query,
            filters=analysis.get(
                "filters",
                {}
            ),
            limit=RAGService.SEARCH_LIMIT
        )

        if not results:
            return {
                "rewritten_question": rewritten_question,
                "context": "",
                "results": []
            }

        best_score = results[0].get(
            "rerank_score",
            0
        )

        if best_score < -5:
            return {
                "rewritten_question": rewritten_question,
                "context": "",
                "results": []
            }

        context = RAGService.build_context(
            results
        )
        
        return {
            "rewritten_question": rewritten_question,
            "context": context,
            "results": results
        }
        
        
        
        