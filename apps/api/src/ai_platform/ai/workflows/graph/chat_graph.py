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
def route_intent(state):

    return state.get(
        "intent",
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
<<<<<<< Updated upstream
        "direct_chat",
        direct_chat_node
=======
        "greeting",
        greeting_node
    )
    
    graph.add_node(
        "general_chat",
        general_chat_node
    )
    
    graph.add_node(
        "metadata",
        metadata_node
    )
    
    
    graph.add_conditional_edges(
        "analyze",
        route_action,
        {
            "greeting": "greeting",
            "chat": "general_chat",
            "metadata": "metadata",
            "rag": "rag",
            "tool": "rag"
        }
>>>>>>> Stashed changes
    )

    # Entry Points
    graph.set_entry_point(
        "analyze"
    )

    # graph.add_edge(
    #     "analyze",
    #     "rag"
    # )

    # Intent Router
    graph.add_conditional_edges(
        "analyze",
        route_intent,
        {
            "greeting": "direct_chat",
            "help": "direct_chat",
            "chat": "rag",

            "summarize": "rag",
            "compare": "rag",
            "data": "rag",
            "rag": "rag"
        }
    )

    # Direct Chat path
    graph.add_edge(
        "direct_chat",
        END
    )

    # RAG path
    # graph.add_edge(
    #     "rag",
    #     "chat"
    # )

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

<<<<<<< Updated upstream

=======
def route_action(state):

    action = state.get(
        "action",
        "rag"
    )

    print("=" * 80)
    print("PLANNER ACTION =", action)
    print("=" * 80)

    return action


def greeting_node(state):
    return {
        "answer": (
            "Hello! 👋\n\n"
            "I'm your Enterprise Knowledge Copilot.\n"
            "You can ask questions about uploaded documents, reports, source code, APIs and datasets."
        )
    }
>>>>>>> Stashed changes




