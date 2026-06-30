from langgraph.graph import StateGraph, END

from src.ai_platform.ai.workflows.states.chat_state import ChatState

from src.ai_platform.ai.workflows.nodes.chat_node import (
    analyze_node,
    rag_node,
    chat_node,
    direct_chat_node
)


def route_action(state):
    action = state.get("action", "rag")
    # Only pure greetings skip RAG — everything else searches Qdrant first.
    if action == "greeting":
        return "greeting"
    return "rag"


def router_context(state):
    context = state.get("context", "")
    if context.strip():
        return "rag_found"
    # No results — chat_node returns "I couldn't find it" without calling LLM.
    return "no_results"


def build_chat_graph():

    graph = StateGraph(ChatState)

    graph.add_node("analyze", analyze_node)
    graph.add_node("rag", rag_node)
    graph.add_node("chat", chat_node)
    graph.add_node("direct_chat", direct_chat_node)

    graph.set_entry_point("analyze")

    # Only greetings skip RAG; everything else searches Qdrant first
    graph.add_conditional_edges(
        "analyze",
        route_action,
        {
            "greeting": "direct_chat",
            "rag": "rag",
        }
    )

    graph.add_edge("direct_chat", END)

    # If RAG finds context → answer; if not → chat says "I couldn't find it"
    graph.add_conditional_edges(
        "rag",
        router_context,
        {
            "rag_found": "chat",
            "no_results": "chat",
        }
    )

    graph.add_edge("chat", END)

    return graph.compile()
