from src.ai_platform.ai.workflows.graph.chat_graph import build_chat_graph


graph = build_chat_graph()

result = graph.invoke(
    {
        "question": "Who is John Doe?",
        "history": []
    }
)

print(result["sources"])

