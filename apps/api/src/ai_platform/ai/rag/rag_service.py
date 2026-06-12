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

    @staticmethod
    def ask(
        question: str,
        history: list = None,
        uploaded_by: int = None
    ):
        analysis = AnalyzeAgent.analyze(
            question,
            history
        )

        rewritten_question = analysis[
            "rewritten_question"
        ]

        results = HybridSearchService.search(
            query=rewritten_question,
            filters=analysis.get(
                "filters",
                {}
            ),
            limit=5,
            uploaded_by=uploaded_by
        )

        top_results = results[:3]

        context = "\n\n".join(
            f"""
FILENAME: {r['filename']}
DOCUMENT_ID: {r['document_id']}
RELEVANCE_SCORE: {r.get('rerank_score', r.get('score', 0))}

CONTENT:
{r['text']}
"""
            for r in top_results
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
        uploaded_by: int = None
    ):

        analysis = AnalyzeAgent.analyze(
            question,
            history
        )

        rewritten_question = analysis[
            "rewritten_question"
        ]

        results = HybridSearchService.search(
            query=rewritten_question,
            filters=analysis.get(
                "filters",
                {}
            ),
            limit=5,
            uploaded_by=uploaded_by
        )

        print("\n===== FINAL RANKING =====")

        for r in results:
            print(
                f"{r['filename']} | "
                f"Score={r.get('rerank_score', r.get('score', 0))}"
            )

        print("=========================\n")

        top_results = results[:3]

        context = "\n\n".join(
            f"""
FILENAME: {r['filename']}
DOCUMENT_ID: {r['document_id']}
RELEVANCE_SCORE: {r.get('rerank_score', r.get('score', 0))}

CONTENT:
{r['text']}
"""
            for r in top_results
        )

        print("\n===== RETRIEVE =====")
        print("QUESTION =", rewritten_question)
        print("RESULTS =", len(results))
        print("CONTEXT LENGTH =", len(context))
        print(context[:1000])
        print("====================\n")

        return {
            "rewritten_question": rewritten_question,
            "context": context,
            "results": results
        }