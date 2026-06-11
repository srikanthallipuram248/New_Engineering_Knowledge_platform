from src.ai_platform.ai.workflows.test_graph import (
    build_chat_graph
)

graph = build_chat_graph()

result = graph.invoke(
    {
        "question": "What is GTUBE?",
        "history": []
    }
)

print(result)