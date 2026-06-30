from langgraph.graph import StateGraph, END

from src.ai_platform.ai.workflows.states.chat_state import ChatState

from src.ai_platform.ai.workflows.nodes.chat_node import (
    analyze_node,
    rag_node,
    chat_node,
    # for intent router
    direct_chat_node
)


# Create Router fuction for intent router graph
# def route_intent(state):
#     return state.get(
#         "intent",
#         "rag"
#     )

def route_action(state):
    action = state.get("action", "rag")
    # Only pure greetings skip RAG — everything else searches Qdrant first.
    # This ensures questions like "what is redis" hit the knowledge base
    # instead of falling back to raw LLM general knowledge.
    if action == "greeting":
        return "greeting"
    return "rag"


def router_context(state):
    context = state.get("context", "")
    if context.strip():
        return "rag_found"
    # No results found — go to chat_node which returns a clean
    # "I couldn't find it" message without calling the LLM.
    return "no_results"


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
        "chat",
        chat_node
    )

    # for intent router
    graph.add_node(
        "direct_chat",
        direct_chat_node
    )

    # Entry Points
    graph.set_entry_point(
        "analyze"
    )

    # graph.add_edge(
    #     "analyze",
    #     "rag"
    # )

    # Only greetings skip RAG; everything else searches Qdrant first
    graph.add_conditional_edges(
        "analyze",
        route_action,
        {
            "greeting": "direct_chat",
            "rag": "rag",
        }
    )

    # Direct Chat path (greetings only)
    graph.add_edge(
        "direct_chat",
        END
    )

    # If RAG finds context → answer from it; if not → chat_node says "I don't know"
    graph.add_conditional_edges(
        "rag",
        router_context,
        {
            "rag_found": "chat",
            "no_results": "chat",
        }
    )


    graph.add_edge(
        "chat",
        END
    )

    return graph.compile()





