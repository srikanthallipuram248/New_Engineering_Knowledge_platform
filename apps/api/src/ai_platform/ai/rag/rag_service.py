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

    SEARCH_LIMIT = 50
    CONTEXT_LIMIT = 8
    MAX_CONTEXT_CHARS = 15000

    @staticmethod
    def build_context(results):

        top_results = results[
            :RAGService.CONTEXT_LIMIT
        ]

        context_parts = []

        for r in top_results:

            text = r["text"][:2000]

            context_parts.append(
                f"""
        FILE: {r['filename']}

        {text}
        """
            )

        context = "\n\n".join(
            context_parts
        )

        print("=" * 80)
        print("CONTEXT SIZE =", len(context))
        print("=" * 80)

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

        keywords = analysis.get(
            "keywords",
            []
        )

        # Always use full question for retrieval

        search_query = rewritten_question

        print("QUESTION =", question)
        print("REWRITTEN =", rewritten_question)
        print("KEYWORDS =", keywords)
        print("SEARCH QUERY =", search_query)

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

        print("=" * 80)
        print("QUESTION =", question)
        print("SEARCH QUERY =", search_query)
        print("RESULT COUNT =", len(results))

        for r in results[:10]:
            print(
                "FILE=",
                r.get("filename"),
                " SCORE=",
                r.get("rerank_score")
            )

        print("=" * 80)


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
        history: list = None,
        #document_ids: list = None
    ):

        analysis = AnalyzeAgent.analyze(
            question,
            history
        )

        rewritten_question = analysis[
            "rewritten_question"
        ]

        filters = analysis.get(
            "filters",
            {}
        )
        # if document_ids:
        #     filters["document_ids"] = document_ids

        keywords = analysis.get(
            "keywords",
            []
        )

        # Always use full question for retrieval

        search_query = rewritten_question

        print("QUESTION =", question)
        print("REWRITTEN =", rewritten_question)
        print("KEYWORDS =", keywords)
        print("SEARCH QUERY =", search_query)

        results = HybridSearchService.search(
            query=search_query,
            filters=filters,
            limit=RAGService.SEARCH_LIMIT
        )

        print("=" * 80)
        print("QUESTION =", question)
        print("SEARCH QUERY =", search_query)
        print("RESULT COUNT =", len(results))

        for r in results[:10]:
            print(
                "FILE=",
                r.get("filename"),
                " SCORE=",
                r.get("rerank_score")
            )

        print("=" * 80)

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
        
        
        
        