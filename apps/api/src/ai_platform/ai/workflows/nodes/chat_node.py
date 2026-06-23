import re
from src.ai_platform.ai.agents.analyze_agent import AnalyzeAgent

from src.ai_platform.ai.rag.rag_service import RAGService

from src.ai_platform.ai.agents.chat_agent import ChatAgent

from groq import Groq
from src.core.config import settings

from src.ai_platform.ai.agents.metadata_agent import (
    MetadataAgent
)


#-------------------
# Analyze Node
#-------------------

def analyze_node(state):
    
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
        
    METADATA_WORDS = [
        "file",
        "files",
        "filename",
        "filenames",
        "uploaded",
        "upload",
        "pdf",
        "excel",
        "xlsx",
        "document count"
    ] 
        
        
    if any(
        word in normalized
        for word in METADATA_WORDS
    ):
        return {
            "intent": "metadata"
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


#-----------------------
# General Chat Node
# --------------------

# def general_chat_node(state):

#     return {
#         "answer": (
#             "I can answer questions about uploaded documents. "
#             "For general conversation, please upload relevant documents."
#         ),
#         "sources": []
#     }


# OR

client = Groq(
    api_key=settings.GROQ_API_KEY
)

def general_chat_node(state):

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        messages=[
            {
                "role": "system",
                "content": """
        You are a helpful AI assistant.

        Answer naturally.

        Be concise.

        Do not mention uploaded documents unless the user asks about them.
        """
            },
            {
                "role": "user",
                "content": state["question"]
            }
        ]
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": []
    }


# ------------------------------
# Metadata node
# ----------------------------
def metadata_node(state):

    result = MetadataAgent.answer(
        question=state["question"],
        db=state["db"],
        user_id=state["uploaded_by"]
    )

    return {
        "answer": result["answer"],
        "sources": []
    }




