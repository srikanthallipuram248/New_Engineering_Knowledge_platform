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
        "give",
        "explain",
        "about",
        "section",
        "document",
        "uploaded",
        "details",
        "detailed",
        "information",
        "describe",
        "from"
    }


    DATA_WORDS = {
        "count",
        "total",
        "sum",
        "average",
        "avg",
        "maximum",
        "minimum",
        "highest",
        "lowest",
        "top",
        "bottom",
        "records",
        "rows",
        "entries",
        "group",
        "filter",
        "statistics"
    }

    # Data Words controller@classmethod
    @classmethod
    def is_data_question(
        cls,
        question: str
    ):

        q = question.lower()

        return any(
            word in q
            for word in cls.DATA_WORDS
        )



    @classmethod
    def classify_intent(
        cls,
        question: str
    ) -> str:

        q = question.lower().strip()

        # Greeting
        if q in {
            "hi",
            "hello",
            "hey",
            "good morning",
            "good afternoon",
            "good evening"
        }:
            return "greeting"

        # Help
        if q in {
            "help",
            "what can you do",
            "show capabilities",
            "show commands"
        }:
            return "help"

        # Summarize
        if any(
            word in q
            for word in [
                "summarize",
                "summary"
            ]
        ):
            return "summarize"

        # Compare
        if any(
            word in q
            for word in [
                "compare",
                "difference",
                "differences",
                "vs"
            ]
        ):
            return "compare"
        if cls.is_data_question(q):
            return "data"

        # Everything else
        return "rag"


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
            r'([A-Za-z0-9_\-]+\.(pdf|txt|doc|docx|csv|xlsx|xls|ppt|pptx|json|xml|md|py|js|ts|java|go|cs|cpp|html|css|sql|yaml|yml))',
            original_question,
            re.IGNORECASE
        )

        if filename_match:

            return {
                "filename": filename_match.group(1)
            }

        return {}

    @classmethod
    def generate_keywords(
        cls,
        question: str
    ):

        question = re.sub(
            r"[^\w\s]",
            " ",
            question.lower()
        )

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

        intent = cls.classify_intent(
            original_question
        )

        question = normalize_query(question)

        use_history = cls.is_followup(
            question
        )

        regex_filters = cls.extract_filename_filter(
            original_question
        )

        # Fast path
        if not use_history:

            return {
                "intent": intent,
                "rewritten_question": original_question,
                "keywords": cls.generate_keywords(
                    question
                ),
                "filters": regex_filters,
                "needs_rag": intent in [
                    "rag",
                    "data",
                    "code",
                    "summarize",
                    "compare"
                ]
            }

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

            result.setdefault(
                "intent",
                intent
            )

            result.setdefault(
                "rewritten_question",
                original_question
            )

            result.setdefault(
                "keywords",
                []
            )

            result.setdefault(
                "filters",
                {}
            )

            result.setdefault(
                "needs_rag",
                True
            )


            if not result.get(
                "rewritten_question"
            ):
                result["rewritten_question"] = (
                    original_question
                )

        except Exception:
            result = {
                "intent": intent,
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
    

    