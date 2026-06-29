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

    #Update for Intent router graph
    return {
        "intent": analysis.get(
            "intent",
            "rag"
        ),
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
    # Pass the state values as the 'analysis' dict to avoid redundant analysis
    analysis = {
        "rewritten_question": state.get("rewritten_question", state["question"]),
        "keywords": state.get("keywords", []),
        "filters": state.get("filters", {})
    }
    
    data = RAGService.retrieve(
        question=state["question"],
        history=state.get("history"),
        document_ids=state.get("document_ids") or [],
        analysis=analysis
    )

    return {
        "context": data["context"],
        "sources": data["results"]
    }



#----------------
# RAG Chat Node
#------------------
def rag_chat_node(state):
    #New
    if not state.get("context", "").strip():
        return {
            "answer": "I could not find any relevant information in the repository to answer your question.",
            "sources": state.get("sources", []),
            "intent": "rag",
            "failure_reason": "no_context"
        }
    
    answer = ChatAgent.answer(
        question=state["rewritten_question"],
        context=state["context"],
        history=state.get("history")
    )

    return {
        "answer": answer,
        "intent": "rag"
    }


#--------------------
# General Chat Node
#--------------------
def general_chat_node(state):
    answer = DirectChatAgent.answer(
        state["question"]
    )

    return {
        "answer": answer,
        "intent": "chat"
    }




