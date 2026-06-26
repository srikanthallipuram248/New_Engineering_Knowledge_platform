class PlannerAgent:

    VALID_ACTIONS = {
        "greeting",
        "chat",
        "metadata",
        "rag",
        "tool"
    }

    @classmethod
    def plan(
        cls,
        analysis: dict
    ):

        if not analysis:

            result = {
                "action": "rag",
                "reason": "No analysis available"
            }

            print("=" * 80)
            print("PLANNER RESULT")
            print(result)
            print("=" * 80)

            return result

        intent = (
            analysis.get("intent", "rag")
            .lower()
            .strip()
        )

        if intent not in cls.VALID_ACTIONS:
            intent = "rag"

        result = {
            "action": intent,
            "reason": f"Routed from AnalyzeAgent ({intent})"
        }

        print("=" * 80)
        print("PLANNER RESULT")
        print(result)
        print("=" * 80)

        return result