from src.ai_platform.ai.agents.analyze_agent import AnalyzeAgent

from src.ai_platform.ai.rag.rag_service import RAGService

from src.ai_platform.ai.llms.groq_service import GroqService

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
<<<<<<< Updated upstream
=======
    
    GREETINGS = {
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "thanks",
        "thank you",
        "bye",
        "how are you",
        "who are you"
    }
    
    question = state["question"].lower().strip()

    # if question in GREETINGS:
    #     return {
    #         "intent": "greeting"
    #     }
        
    # OR

    normalized = re.sub(
        r"[^\w\s]",
        "",
        question
    ).strip()

    if normalized in GREETINGS:
        return {
            "intent": "greeting",
            "rewritten_question": state["question"],
            "keywords": [],
            "filters": {}
        }  
        
    
    if MetadataAgent.detect(
        state["question"]
    ):
        return {
            "intent": "metadata"
        }
    
    
>>>>>>> Stashed changes
    analysis = AnalyzeAgent.analyze(
        question=state["question"],
        history=state.get("history"),
        memory=state.get("memory")
    )
    
    #Planner
    plan = PlannerAgent.plan(
        analysis
    )

<<<<<<< Updated upstream
    intent = analysis.get("intent", "rag")

    # If the user scoped the chat to specific documents, always use
    # the RAG path — their intent is clearly to query those documents,
    # regardless of how the question is phrased.
    if state.get("document_ids"):
        intent = "rag"

    return {
        "intent": intent,
=======
    print("=" * 80)
    print("ANALYSIS RESULT =", analysis)
    print("CHAT NODE MEMORY")
    print(state.get("memory"))
    print("PLANNER")
    print(plan)
    print("=" * 80)
    
    return {
        "intent": analysis.get("intent", "rag"),

        "plan": plan,

        "action": plan.get(
            "action",
            analysis.get("intent", "rag")
        ),

>>>>>>> Stashed changes
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
        document_ids=state.get("document_ids") or [],
        rewritten_question=state.get("rewritten_question"),
        keywords=state.get("keywords"),
        filters=state.get("filters"),
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
<<<<<<< Updated upstream
=======
    if not state.get("context", "").strip():

        return {
            "answer": (
                "I could not find relevant information "
                "in the uploaded documents."
            ),
            "sources": []
        }
    
    print("=" * 80)
    print("CHAT NODE EXECUTED")
    print("CONTEXT LENGTH =", len(state.get("context", "")))
    print("SOURCE COUNT =", len(state.get("sources", [])))
    print("CHAT AGENT MEMORY")
    print(state.get("memory"))
    print("=" * 80)

>>>>>>> Stashed changes
    answer = ChatAgent.answer(
        question=state["rewritten_question"],
        context=state["context"],
        history=state.get("history"),
        memory=state.get("memory")
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
