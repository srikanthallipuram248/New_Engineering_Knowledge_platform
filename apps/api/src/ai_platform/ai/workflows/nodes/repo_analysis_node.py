import json
from functools import lru_cache

from langchain_groq import ChatGroq

from src.core.config import settings
from src.modules.analyzer.services.repo_scanner_service import scan_git_url
from src.modules.analyzer.schemas.analyzer_schema import RepoAnalysisResult
from src.ai_platform.ai.prompts.analyzer_prompt import (
    get_chat_prompt,
    build_user_context,
)
from src.ai_platform.ai.workflows.states.repo_analysis_state import RepoAnalysisState


@lru_cache(maxsize=1)
def get_llm() -> ChatGroq:
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=settings.GROQ_ANALYSIS_MODEL,
        temperature=0,
        max_tokens=8192,
    )


# ── Node 1 ─────────────────────────────────────────────────────────────────

def clone_and_scan(state: RepoAnalysisState) -> dict:
    ctx = scan_git_url(state["git_url"])
    return {
        "repo_name": ctx.repo_name,
        "readme_content": ctx.readme_content,
        "readme_found": ctx.readme_found,
        "folder_tree": ctx.folder_tree,
        "manifest_content": ctx.manifest_content,
        "source_snippets": ctx.source_snippets,
        "indexable_files": ctx.indexable_files,
    }


# ── Node 2 ─────────────────────────────────────────────────────────────────

def run_llm(state: RepoAnalysisState) -> dict:
    user_input = build_user_context(
        repo_name=state["repo_name"],
        readme_content=state.get("readme_content"),
        folder_tree=state["folder_tree"],
        manifest_content=state["manifest_content"],
        source_snippets=state["source_snippets"],
        readme_found=state["readme_found"],
    )

    chain = get_chat_prompt() | get_llm()
    response = chain.invoke({"user_input": user_input})
    return {"raw_output": response.content}


# ── Node 3 ─────────────────────────────────────────────────────────────────

def parse_output(state: RepoAnalysisState) -> dict:
    raw = state.get("raw_output", "")
    retry_count = state.get("retry_count", 0)

    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        data = json.loads(cleaned)

        # Ensure readme_found matches actual scan result
        data["readme_found"] = state["readme_found"]
        data.setdefault("repo_name", state["repo_name"])

        # Validate against Pydantic schema
        validated = RepoAnalysisResult(**data)
        return {"analysis_result": validated.model_dump(), "retry_count": retry_count}

    except Exception:
        return {"analysis_result": None, "retry_count": retry_count + 1}


# ── Node 4 ─────────────────────────────────────────────────────────────────

def handle_error(state: RepoAnalysisState) -> dict:
    return {
        "error": (
            f"Analysis failed after {state.get('retry_count', 0)} retries. "
            "The LLM did not return valid structured JSON."
        )
    }
