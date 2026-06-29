from langgraph.graph import StateGraph, END

from src.ai_platform.ai.workflows.states.chat_state import ChatState

from src.ai_platform.ai.workflows.nodes.chat_node import (
    analyze_node,
    rag_node,
    chat_node,
    direct_chat_node
)




def route_action(state):
    return state.get(
        "action",
        "rag"
    )


def router_context(state):

    context = state.get(
        "context",
        ""
    )

    if context.strip():
        return "rag_found"

    # If the user scoped to specific documents and we found nothing,
    # still go through the chat node so the LLM can say "I couldn't
    # find that in the selected document" rather than falling back to
    # the generic direct_chat agent which ignores document context.
    if state.get("document_ids"):
        return "rag_found"

    return "no_results"


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

    graph.add_node(
        "direct_chat",
        direct_chat_node
    )

    graph.set_entry_point(
        "analyze"
    )

    # graph.add_edge(
    #     "analyze",
    #     "rag"
    # )

    graph.add_conditional_edges(
        "analyze",
        route_action,
        {
            "greeting": "direct_chat",
            "chat": "direct_chat",
            "rag": "rag",
            "metadata": "direct_chat"
        }
    )

    graph.add_edge(
        "direct_chat",
        END
    )


    graph.add_conditional_edges(
        "rag",
        router_context,
        {
            "rag_found": "chat",
            "no_results": "direct_chat"
        }
    )


    graph.add_edge(
        "chat",
        END
    )

    return graph.compile()





