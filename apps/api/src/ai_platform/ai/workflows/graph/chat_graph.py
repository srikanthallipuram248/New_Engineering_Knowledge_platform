from langgraph.graph import StateGraph, END


from src.ai_platform.ai.workflows.states.chat_state import ChatState
from src.ai_platform.ai.workflows.nodes.chat_node import(
    analyze_node,
    rag_node,
    chat_node,
    #Intent router graph import
    direct_chat_node
)


def build_chat_graph():

    graph = StateGraph(ChatState)


    #Nodes
    graph.add_node("analyze", analyze_node)
    graph.add_node("rag", rag_node)
    graph.add_node("chat", chat_node)
    #Intent router graph
    graph.add_node("direct_chat", direct_chat_node)


    #Flow
    graph.set_entry_point("analyze")

    # graph.add_edge("analyze", "rag")
    # graph.add_edge("rag", "chat")

    #Intent router graph
    graph.add_conditional_edges(
        "analyze",
        router_intent,
        {
            "rag": "rag",
            "chat": "direct_chat",
            "db": "rag"
        }
    )

    graph.add_edge(
        "rag",
        "chat"
    )

    graph.add_edge(
        "chat",
        END
    )

    graph.add_edge(
        "direct_chat",
        END
    )

    return graph.compile()


#Intent router graph
def router_intent(state):

    intent = state.get(
        "intent",
        "rag"
    )

    print("INTENT =", intent)

    return intent















