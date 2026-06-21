from src.ai_platform.ai.agents.analyze_agent import AnalyzeAgent

from src.ai_platform.ai.rag.rag_service import RAGService

from src.ai_platform.ai.agents.chat_agent import ChatAgent

#-------------------
# Analyze Node
#-------------------

def analyze_node(state):
    analysis = AnalyzeAgent.analyze(
        state["question"],
        state.get("history")
    )

    print("=" * 80)
    print("ANALYSIS RESULT =", analysis)
    print("=" * 80)

    #Update for Intent router graph
    # return {
    #     "intent": analysis.get(
    #         "intent",
    #         "rag"
    #     ),
    #     "rewritten_question": analysis.get(
    #         "rewritten_question",
    #         state["question"]
    #     ),
    #     "keywords": analysis.get(
    #         "keywords",
    #         []
    #     ),
    #     "filters": analysis.get(
    #         "filters",
    #         {}
    #     )
    # }
    
    return {
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
        analysis=analysis
    )

    print("=" * 80)
    print("CONTEXT LENGTH =", len(data["context"]))
    print("RESULT COUNT =", len(data["results"]))
    print("=" * 80)

    return {
        "context": data["context"],
        "sources": data["results"]
    }



#----------------
# RAG Chat Node
#------------------
def chat_node(state):
    #New
    if not state.get("context", "").strip():
        return {
            "answer": "I could not find any relevant information in the repository to answer your question.",
            "sources": state.get("sources", [])
        }
    
    print("=" * 80)
    print("CHAT NODE EXECUTED")
    print("CONTEXT LENGTH =", len(state.get("context", "")))
    print("SOURCE COUNT =", len(state.get("sources", [])))
    print("=" * 80)

    answer = ChatAgent.answer(
        question=state.get(
            "rewritten_question",
            state["question"]
        ),
        context=state["context"],
        history=state.get("history")
    )

    sources = []

    for source in state.get("sources", [])[:5]:

        filename = source.get("filename")

        if filename and filename not in sources:
            sources.append(filename)

    # if sources:

    #     answer += "\n\nSources:\n"

    #     for filename in sources:
    #         answer += f"- {filename}\n"

    return {
        "answer": answer
    }


#--------------------
# General Chat Node
#--------------------
# def general_chat_node(state):
#     return {
#         "answer": (
#             "This question is outside the uploaded documents "
#             "and repository knowledge."
#         ),
#         "intent": "chat",
#         "sources": []
#     }





