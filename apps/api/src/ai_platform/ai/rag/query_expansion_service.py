from src.ai_platform.ai.agents.analyze_agent import (
    AnalyzeAgent
)

from src.modules.documents.utils.query_normalizer import (
    normalize_query
)




class QueryExpansionService:

    @staticmethod
    def expand(question: str):

        question = normalize_query(
            question
        )

        analysis = AnalyzeAgent.analyze(
            question
        )

        queries = [
            question,
            analysis["rewritten_question"]
        ]

        for keyword in analysis.get(
            "keywords",
            []
        ):
            queries.append(keyword)

        return list(set(queries))








