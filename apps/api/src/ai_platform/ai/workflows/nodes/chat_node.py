from src.ai_platform.ai.agents.analyze_agent import AnalyzeAgent

from src.ai_platform.ai.rag.rag_service import RAGService

from src.ai_platform.ai.llms.groq_service import GroqService

from src.ai_platform.ai.agents.chat_agent import ChatAgent

from src.ai_platform.ai.agents.direct_chat_agent import (
    DirectChatAgent
)



#-------------------
# Analyze Node
#-------------------

def analyze_node(state):
    analysis = AnalyzeAgent.analyze(
        state["question"],
        state.get("history")
    )

    intent = analysis.get("intent", "rag")

    # If the user scoped the chat to specific documents, always use
    # the RAG path — their intent is clearly to query those documents,
    # regardless of how the question is phrased.
    if state.get("document_ids"):
        intent = "rag"

    return {
        "intent": intent,
        "rewritten_question": analysis.get(
            "rewritten_question",
            state["question"]
        ),
        "keywords": analysis.get(
            "keywords",
            []
        ),
        "filters": analysis.get(
            "filters",
            {}
        )
    }



#-----------------
# RAG Node
#-------------------
def rag_node(state):
    data = RAGService.retrieve(
        question=state["rewritten_question"],
        history=state.get("history"),
        document_ids=state.get("document_ids") or []
    )
    return {
        "context": data["context"],
        "sources": data["results"]
    }



#----------------
# Chat Node
#------------------
def chat_node(state):
    #New
    answer = ChatAgent.answer(
        question=state["rewritten_question"],
        context=state["context"],
        history=state.get("history")
    )

    return {
        "answer": answer
    }


#------------------
# Direct chat node
# -----------------

def direct_chat_node(state):
    answer = DirectChatAgent.answer(
        state["question"]
    )

    return {
        "answer": answer
    }
