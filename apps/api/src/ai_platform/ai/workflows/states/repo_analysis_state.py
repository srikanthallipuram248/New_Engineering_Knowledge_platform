from typing import TypedDict, Optional


class RepoAnalysisState(TypedDict):
    git_url: str
    repo_name: str
    readme_content: Optional[str]
    readme_found: bool
    folder_tree: str
    manifest_content: str
    source_snippets: str
    raw_output: str
    analysis_result: Optional[dict]
    retry_count: int
    error: Optional[str]
