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
        "continue",
        "more",
        "above",
        "below",
        "same",
        "mentioned",
        "explained",
        "there"
    }

    STOP_WORDS = {
        "what",
        "which",
        "where",
        "when",
        "why",
        "how",
        "the",
        "a",
        "an",
        "is",
        "are",
        "was",
        "were",
        "can",
        "could",
        "should",
        "would",
        "tell",
        "show",
        "give",
        "explain"
    }

    @classmethod
    def is_followup(
        cls,
        question: str
    ) -> bool:

        q = question.lower().strip()

        words = set(q.split())

        if cls.FOLLOWUP_WORDS.intersection(words):
            return True

        if (
            len(q.split()) <= 5
            and q.startswith(
                (
                    "why",
                    "how",
                    "when",
                    "where"
                )
            )
        ):
            return True

        return False

    @classmethod
    def extract_filename_filter(
        cls,
        original_question: str
    ):

        filename_match = re.search(
            r'([A-Za-z0-9_\-\s]+\.(pdf|txt|doc|docx|csv|xlsx|xls|ppt|pptx|json|xml|md))',
            original_question,
            re.IGNORECASE
        )

        if filename_match:

            return {
                "filename": filename_match.group(1).strip()
            }

        return {}

    @classmethod
    def generate_keywords(
        cls,
        question: str
    ):

        return list(
            dict.fromkeys(
                [
                    word
                    for word in question.split()
                    if len(word) > 2
                    and word not in cls.STOP_WORDS
                ]
            )
        )

    @classmethod
    def analyze(
        cls,
        question: str,
        history=None
    ):

        original_question = question

        question = normalize_query(question)

        use_history = cls.is_followup(
            question
        )

        regex_filters = cls.extract_filename_filter(
            original_question
        )

        # Fast path
        if not use_history:

            result = {
                "intent": "rag",
                "rewritten_question": original_question,
                "keywords": cls.generate_keywords(
                    question
                ),
                "filters": regex_filters,
                "needs_rag": True
            }

            return result

        messages = [
            {
                "role": "system",
                "content": ANALYZE_SYSTEM_PROMPT
            }
        ]

        for msg in (history or [])[-5:]:

            messages.append(
                {
                    "role": msg.role,
                    "content": msg.content
                }
            )

        messages.append(
            {
                "role": "user",
                "content": original_question
            }
        )

        try:

            response = cls.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.0
            )

            content = (
                response
                .choices[0]
                .message
                .content
            )

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
            if result.get("rewritten_question"):
                result["rewritten_question"] = original_question

        except Exception as e:
            result = {
                "intent": "rag",
                "rewritten_question": original_question,
                "keywords": cls.generate_keywords(
                    question
                ),
                "filters": {},
                "needs_rag": True
            }

        llm_filters = result.get(
            "filters",
            {}
        )

        llm_filters.update(
            regex_filters
        )

        result["filters"] = llm_filters

        result["intent"] = "rag"

        if not result.get(
            "keywords"
        ):
            result["keywords"] = cls.generate_keywords(
                result.get(
                    "rewritten_question",
                    question
                )
            )

        return result
    
    
