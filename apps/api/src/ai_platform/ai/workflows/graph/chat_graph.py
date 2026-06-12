from langgraph.graph import StateGraph, END

from src.ai_platform.ai.workflows.states.chat_state import ChatState

from src.ai_platform.ai.workflows.nodes.chat_node import (
    analyze_node,
    rag_node,
    chat_node
)


def build_chat_graph():

    graph = StateGraph(ChatState)

    graph.add_node(
        "analyze",
        analyze_node
    )

    graph.add_node(
        "rag",
        rag_node
    )

    graph.add_node(
        "chat",
        chat_node
    )

    graph.set_entry_point(
        "analyze"
    )

    graph.add_edge(
        "analyze",
        "rag"
    )

    graph.add_edge(
        "rag",
        "chat"
    )

    graph.add_edge(
        "chat",
        END
    )

    return graph.compile()


