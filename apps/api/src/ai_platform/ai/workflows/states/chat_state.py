from typing import TypedDict, Optional, List


class ChatState(TypedDict):

    # question: str
    # history: Optional[list]

    # rewritten_question: str
    # keywords: List[str]

    # context: str
    # #New
    # sources: list
    
    # answer: str

    #New for Metadata filtering
    question: str
    history: Optional[list]

    rewritten_question: str
    keywords: List[str]

    filters: dict

    context: str

    #New
    sources: list

    answer: str

    #New for Intent
    intent: str

    uploaded_by: int












