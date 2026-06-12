from groq import Groq
from src.core.config import settings
import json
import re

from src.modules.documents.utils.query_normalizer import (
    normalize_query
)

class AnalyzeAgent:

    client = Groq(api_key=settings.GROQ_API_KEY)

    @classmethod
    def analyze(cls, question: str, history=None):

        # Normalize query FIRST
        question = normalize_query(question)
        
        messages = [
            {
                "role": "system",
                "content": """
You are an AI Query Analyzer for a RAG system.

IMPORTANT RULE:
If the user question is unclear (like "it", "this", "that"),
you MUST expand it using conversation history.

Your job:
1. Understand intent
2. Rewrite question into a FULL standalone question
3. Extract keywords/entities
4. Make it optimized for document search
5. Extract metadata filters when present

Return ONLY valid JSON:

{
  "intent": "rag | chat | db | followup",
  "rewritten_question": "FULL EXPANDED QUESTION",
  "keywords": ["..."],
  "filters": {},
  "needs_rag": true
}

Rules:
- NEVER return vague questions
- ALWAYS expand references like "it"
- If unknown, infer from context
- DO NOT answer, only rewrite

Examples:

"search in test.txt"
→ filters = {
    "filename": "test.txt"
}

"search only pdf documents"
→ filters = {
    "file_type": "pdf"
}

If no filters exist:
→ filters = {}

"""
            }
        ]

        # Add chat history (optional but powerful)
        if history:
            for msg in history[-5:]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        # Current question
        messages.append({
            "role": "user",
            "content": question
        })

        response = cls.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.1
        )

        content = response.choices[0].message.content

        # -----------------------
        # Parse LLM JSON safely
        # -----------------------
        
        try:

            cleaned = content.strip()

            if cleaned.startswith("```"):
                cleaned = cleaned.replace(
                    "```json",
                    ""
                )
                cleaned = cleaned.replace(
                    "```",
                    ""
                )
                cleaned = cleaned.strip()
            #Extract JSON from LLM response
            match = re.search(
                r'\{.*\}',
                cleaned,
                re.DOTALL
            )
            
            if match:
                cleaned = match.group(0)
                
            result = json.loads(cleaned)
        except Exception as e:
            #print("JSON ERROR =", e)
           # print("RAW CONTENT =", content)

            result = {
                "intent": "rag",
                "rewritten_question": question,
                "keywords": [],
                "filters": {},
                "needs_rag": True
            }

        # -----------------------
        # Deterministic filters
        # -----------------------

        filters = result.get("filters") or {}

        filename_match = re.search(
            r'([\w\-]+\.(pdf|txt|doc|docx|csv|xlsx|pptx))',
            question,
            re.IGNORECASE
        )

        if filename_match:
            filters["filename"] = filename_match.group(1)

        result["filters"] = filters

        # Force document retrieval
        result["intent"] = "rag"
        
        return result