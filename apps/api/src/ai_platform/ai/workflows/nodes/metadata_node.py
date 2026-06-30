from src.ai_platform.ai.agents.metadata_agent import (
    MetadataAgent
)

def metdata_node(state):
    
    result = MetadataAgent.answer(
        question=state["question"],
        db=state["db"],
        user_id=state["user_id"]
    )
    
    return {
        "answer": result["answer"],
        "sources": result["sources"]
    }









