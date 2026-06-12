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

class AnalyzeAgent:

    client = Groq(
        api_key=settings.GROQ_API_KEY
    )

    @classmethod
    def is_followup(
        cls,
        question: str
    ) -> bool:

        q = question.lower().strip()

        FOLLOWUP_WORDS = {
            "it",
            "this",
            "that",
            "these",
            "those",
            "they",
            "them",
            "earlier",
            "previous",
            "previously",
            "continue"
        }

        words = set(q.split())

        if FOLLOWUP_WORDS.intersection(words):
            return True

        if q.startswith(
            (
                "why",
                "how",
                "when",
                "where"
            )
        ) and len(q.split()) <= 6:
            return True

        return False

    @classmethod
    def analyze(
        cls,
        question: str,
        history=None
    ):

        # -----------------------
        # Normalize query
        # -----------------------

        question = normalize_query(
            question
        )

        # -----------------------
        # Detect followup
        # -----------------------

        use_history = cls.is_followup(
            question
        )

        # -----------------------
        # Deterministic filename filter
        # -----------------------

        regex_filters = {}

        filename_match = re.search(
            r'([A-Za-z0-9_\-\s]+\.(pdf|txt|doc|docx|csv|xlsx|ppt|pptx))',
            question,
            re.IGNORECASE
        )

        if filename_match:

            regex_filters["filename"] = (
                filename_match.group(1).strip()
            )

        # -----------------------
        # Fast path
        # Skip LLM for normal queries
        # -----------------------

        if not use_history:

            result = {
                "intent": "rag",
                "rewritten_question": question,
                "keywords": [
                    word
                    for word in question.split()
                    if len(word) > 2
                ],
                "filters": regex_filters,
                "needs_rag": True
            }

            print(
                f"[ANALYZE] "
                f"history=False "
                f"question='{question}'"
            )

            return result

        # -----------------------
        # Build messages
        # -----------------------

        messages = [
            {
                "role": "system",
                "content": ANALYZE_SYSTEM_PROMPT
            }
        ]

        if history:

            for msg in history[-5:]:

                messages.append(
                    {
                        "role": msg.role,
                        "content": msg.content
                    }
                )

        messages.append(
            {
                "role": "user",
                "content": question
            }
        )

        # -----------------------
        # Call LLM
        # -----------------------

        response = cls.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.1
        )

        content = (
            response
            .choices[0]
            .message
            .content
        )

        # -----------------------
        # Parse JSON safely
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

            match = re.search(
                r"\{.*\}",
                cleaned,
                re.DOTALL
            )

            if match:
                cleaned = match.group(0)

            result = json.loads(
                cleaned
            )

        except Exception as e:

            print(
                "JSON ERROR =",
                repr(e)
            )

            result = {
                "intent": "rag",
                "rewritten_question": question,
                "keywords": [],
                "filters": {},
                "needs_rag": True
            }

        # -----------------------
        # Merge filters
        # -----------------------

        llm_filters = result.get(
            "filters",
            {}
        )

        llm_filters.update(
            regex_filters
        )

        result["filters"] = (
            llm_filters
        )

        result["intent"] = "rag"

        print(
            f"[ANALYZE] "
            f"history=True "
            f"question='{question}' "
            f"rewritten='{result.get('rewritten_question')}' "
            f"filters={result.get('filters', {})}"
        )

        return result
