from src.ai_platform.ai.agents.analyze_agent import AnalyzeAgent

from src.ai_platform.ai.rag.rag_service import RAGService

from src.ai_platform.ai.agents.chat_agent import ChatAgent

#-------------------
# Analyze Node
#-------------------

def analyze_node(state):
    
    GREETINGS = [
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
    ]
    
    question = state["question"].lower().strip()

    if len(question.split()) <= 4 and any(
        word in question
        for word in GREETINGS
    ):
        return {
            "intent": "greeting"
        }
        
    analysis = AnalyzeAgent.analyze(
        state["question"],
        state.get("history")
    )

    print("=" * 80)
    print("ANALYSIS RESULT =", analysis)
    print("=" * 80)
    
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

    analysis = {
        "rewritten_question": state.get(
            "rewritten_question",
            state["question"]
        ),
        "keywords": state.get(
            "keywords",
            []
        ),
        "filters": state.get(
            "filters",
            {}
        )
    }

    data = RAGService.retrieve(
        question=state["question"],
        history=state.get("history"),
        analysis=analysis
    )

    
    filtered_results = data["results"]

    print("=" * 80)
    print("TOTAL RESULTS =", len(data["results"]))
    print("FILTERED RESULTS =", len(filtered_results))
    print("=" * 80)

    # No good matches
    if not filtered_results:

        return {
            "context": "",
            "sources": []
        }

    # Build context only from filtered results
    # context = "\n\n".join([
    #     r.get("text", "")
    #     for r in filtered_results
    # ])
    context = RAGService.build_context(
        filtered_results
    )

    return {
        "context": context,
        "sources": filtered_results
    }



#----------------
# RAG Chat Node
#------------------
def chat_node(state):
    #New
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
        "answer": answer,
        "sources": state.get("sources", [])
    }







