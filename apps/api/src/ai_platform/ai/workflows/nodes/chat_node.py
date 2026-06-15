from src.ai_platform.ai.agents.analyze_agent import AnalyzeAgent

from src.ai_platform.ai.rag.rag_service import RAGService

from src.ai_platform.ai.llms.groq_service import GroqService

from src.ai_platform.ai.agents.chat_agent import ChatAgent



#-------------------
# Analyze Node
#-------------------

def analyze_node(state):
    analysis = AnalyzeAgent.analyze(
        state["question"],
        state.get("history")
    )

    # return {
    #     "rewritten_question": analysis["rewritten_question"],
    #     "keywords": analysis.get("keywords", []),
    #     "filters": analysis.get("filters", {})
    # }

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
    # context = RAGService.ask(
    #     question=state["rewritten_question"],
    #     history=state.get("history")
    # )

    # return {
    #     "context": context
    # }

    #new
    data = RAGService.retrieve(
        question=state["rewritten_question"],
        history=state.get("history"),
        document_ids=state.get("document_ids") or []
    )
    #New
    return {
        "context": data["context"],
        "sources": data["results"]
    }



#----------------
# Chat Node
#------------------
def chat_node(state):
    # answer = GroqService.generate(
    #     question=state["rewritten_question"],
    #     context=state["context"],
    #     history=state.get("history")
    # )

    # return {
    #     "answer": answer
    # }

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

    answer = ChatAgent.answer(
        question=state["question"],
        context="",
        history=state.get(
            "history"
        )
    )

    return {
        "answer": answer
    }





