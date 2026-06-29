from langgraph.graph import StateGraph, END

from src.ai_platform.ai.workflows.states.chat_state import ChatState

from src.ai_platform.ai.workflows.nodes.chat_node import (
    analyze_node,
    rag_node,
    rag_chat_node,
    general_chat_node
)


# Create Router fuction for intent router graph
def route_intent(state):

    if state.get("intent") == "chat":
        return "chat"
    
    return "rag"


def build_chat_graph():

    graph = StateGraph(ChatState)

    # Nodes
    graph.add_node(
        "analyze",
        analyze_node
    )

    graph.add_node(
        "rag",
        rag_node
    )

    graph.add_node(
        "rag_chat",
        rag_chat_node
    )

    graph.add_node(
        "general_chat",
        general_chat_node
    )

    # Entry Points
    graph.set_entry_point(
        "analyze"
    )

    # Intent Router
    graph.add_conditional_edges(
        "analyze",
        route_intent,
        {
            "chat": "general_chat",
            "rag": "rag"
        }
    )

    # RAG path
    graph.add_edge(
        "rag",
        "rag_chat"
    )

    graph.add_edge(
        "rag_chat",
        END
    )

    graph.add_edge(
        "general_chat",
        END
    )

    return graph.compile()






