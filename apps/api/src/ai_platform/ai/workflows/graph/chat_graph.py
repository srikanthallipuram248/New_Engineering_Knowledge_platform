from langgraph.graph import StateGraph, END

from src.ai_platform.ai.workflows.states.chat_state import ChatState

from src.ai_platform.ai.workflows.nodes.chat_node import (
    analyze_node,
    rag_node,
    chat_node
    #general_chat_node
)



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

    graph.add_node(
        "greeting",
        greeting_node
    )
    
    graph.add_conditional_edges(
        "analyze",
        route_intent,
        {
            "greeting": "greeting",
            "rag": "rag"
        }
    )

    # Entry Points
    graph.set_entry_point(
        "analyze"
    )    

    # RAG path
    graph.add_edge(
        "rag",
        "chat"
    )
    graph.add_edge(
        "greeting",
        END
    )

    graph.add_edge(
        "chat",
        END
    )
    

    return graph.compile()

def route_intent(state):

    if state.get("intent") == "greeting":
        return "greeting"

    return "rag"


def greeting_node(state):
    return {
        "answer": (
            "Hello! 👋\n\n"
            "I'm your Enterprise Knowledge Copilot.\n"
            "You can ask questions about uploaded documents, reports, source code, APIs and datasets."
        )
    }


