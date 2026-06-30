from src.ai_platform.ai.agents.analyze_agent import AnalyzeAgent

from src.ai_platform.ai.rag.rag_service import RAGService

from src.ai_platform.ai.agents.chat_agent import ChatAgent

from src.ai_platform.ai.agents.direct_chat_agent import (
    DirectChatAgent
)

from src.ai_platform.ai.agents.planner_agent import (
    PlannerAgent
)




#-------------------
# Analyze Node
#-------------------

def analyze_node(state):
    analysis = AnalyzeAgent.analyze(
        question=state["question"],
        history=state.get("history"),
        memory=state.get("memory")
    )
    
    #Planner
    plan = PlannerAgent.plan(
        analysis=analysis
    )

    intent = analysis.get("intent", "rag")

    # If the user scoped the chat to specific documents, always use
    # the RAG path — their intent is clearly to query those documents,
    # regardless of how the question is phrased.
    if state.get("document_ids"):
        intent = "rag"
        plan["action"] = "rag"
        
    
    print("=" * 80)
    print("ANALYZE")
    print(analysis)
    print("=" * 80)

    print("=" * 80)
    print("PLAN")
    print(plan)
    print("=" * 80)

    return {
        "intent": intent,
        "plan": plan,
        "action": plan["action"],
        "rewritten_question": analysis["rewritten_question"],
        "keywords": analysis["keywords"],
        "filters": analysis["filters"]
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
        analysis=analysis,
    )
    
    print(state["rewritten_question"])

    print("=" * 80)
    print("RAG RESULTS")
    print(len(data["results"]))
    print("=" * 80)

    print("=" * 80)
    print("CONTEXT")
    print(data["context"][:1000])
    print("=" * 80)
    
    return {
        "context": data["context"],
        "sources": data["results"]
    }



#----------------
# RAG Chat Node
#------------------
def chat_node(state):

    if not state.get("context", "").strip():

        return {
            "answer": (
                "I could not find relevant information "
                "in the uploaded documents."
            ),
            "sources": []
        }

    answer = ChatAgent.answer(
        question=state["rewritten_question"],
        context=state["context"],
        history=state.get("history"),
        memory=state.get("memory")
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




