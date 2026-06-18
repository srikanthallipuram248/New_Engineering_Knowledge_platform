from groq import Groq
from src.core.config import settings

import json
import re

from src.modules.documents.utils.query_normalizer import (
    normalize_query
)

from src.ai_platform.ai.prompts.analyze_prompt import (
    ANALYZE_SYSTEM_PROMPT
)

from src.ai_platform.ai.prompts.query_classifier_prompt import (
    QUERY_CLASSIFIER_PROMPT
)



class AnalyzeAgent:

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    
    @classmethod
    def analyze(
        cls,
        question: str,
        history: list = None
    ):
        try:
            # Prepare history for the prompt
            formatted_history = []
            if history:
                for h in history:
                    if isinstance(h, dict):
                        formatted_history.append(h)
                    elif hasattr(h, "model_dump"):
                        formatted_history.append(h.model_dump())
                    elif hasattr(h, "role") and hasattr(h, "content"):
                        formatted_history.append({
                            "role": h.role,
                            "content": h.content
                        })
                    else:
                        try:
                            formatted_history.append(dict(h))
                        except Exception:
                            pass

            response = cls.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                temperature=0,
                messages=[
                    {
                        "role": "system",
                        "content": ANALYZE_SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "question": question,
                                "history": formatted_history
                            }
                        )
                    }
                ]
            )

            content = response.choices[0].message.content.strip()
            
            # Extract JSON if the model wrapped it in code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            analysis = json.loads(content)

            return {
                "intent": analysis.get("intent", "rag"),
                "rewritten_question": analysis.get("rewritten_question", question),
                "keywords": analysis.get("keywords", []),
                "filters": analysis.get("filters", {})
            }

        except Exception as e:
            print(f"Error in AnalyzeAgent: {e}")
            # Fallback to defaults
            return {
                "intent": "rag",
                "rewritten_question": question,
                "keywords": [],
                "filters": {}
            }



