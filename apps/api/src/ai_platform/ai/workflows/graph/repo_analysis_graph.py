"""
Repo Analysis Graph — Agent 1

Graph topology:

  [START]
     │
     ▼
  clone_and_scan       ← shallow-clone repo, extract README / folder tree
     │
     ▼
  run_llm              ← ChatGroq via LangChain, returns raw JSON text
     │
     ▼
  parse_output         ← validate JSON, Pydantic schema check
     │
     ├── success ──────────────────────────────────► [END]
     ├── retry (retry_count < 3) ─────────────────► run_llm
     └── give_up (retry_count ≥ 3) ─► handle_error ► [END]
"""

from langgraph.graph import END, StateGraph

from src.ai_platform.ai.workflows.states.repo_analysis_state import RepoAnalysisState
from src.ai_platform.ai.workflows.nodes.repo_analysis_node import (
    clone_and_scan,
    run_llm,
    parse_output,
    handle_error,
)


def _route_after_parse(state: RepoAnalysisState) -> str:
    if state.get("analysis_result") is not None:
        return "success"
    if state.get("retry_count", 0) < 3:
        return "retry"
    return "give_up"


def build_repo_analysis_graph():
    graph = StateGraph(RepoAnalysisState)

    graph.add_node("clone_and_scan", clone_and_scan)
    graph.add_node("run_llm", run_llm)
    graph.add_node("parse_output", parse_output)
    graph.add_node("handle_error", handle_error)

    graph.set_entry_point("clone_and_scan")
    graph.add_edge("clone_and_scan", "run_llm")
    graph.add_edge("run_llm", "parse_output")
    graph.add_conditional_edges(
        "parse_output",
        _route_after_parse,
        {
            "success":  END,
            "retry":    "run_llm",
            "give_up":  "handle_error",
        },
    )
    graph.add_edge("handle_error", END)

    return graph.compile()


# Compiled once at import time — reused for every request
_graph = build_repo_analysis_graph()


def run_repo_analysis_graph(git_url: str) -> tuple[dict, list]:
    initial_state: RepoAnalysisState = {
        "git_url":          git_url,
        "repo_name":        "",
        "readme_content":   None,
        "readme_found":     False,
        "folder_tree":      "",
        "manifest_content": "",
        "source_snippets":  "",
        "indexable_files":  [],
        "raw_output":       "",
        "analysis_result":  None,
        "retry_count":      0,
        "error":            None,
    }

    final_state = _graph.invoke(initial_state)

    if not final_state.get("analysis_result"):
        raise ValueError(
            final_state.get("error") or "Analysis produced no result"
        )

    result = final_state["analysis_result"]
    # Inject the scanned folder tree directly — LLM doesn't need to regenerate it
    result["folder_tree"] = final_state.get("folder_tree", "")
    indexable_files = final_state.get("indexable_files", [])
    return result, indexable_files
