from src.ai_platform.ai.agents.analyze_agent import (
    AnalyzeAgent
)


class QueryExpansionService:

    @staticmethod
    def expand(
        question: str
    ):
        
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

        return list(
            set(queries)
        )








