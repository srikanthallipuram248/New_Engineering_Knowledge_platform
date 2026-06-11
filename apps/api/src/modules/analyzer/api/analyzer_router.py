from fastapi import APIRouter, Depends, HTTPException

from src.shared.dependencies import get_current_user
from src.modules.analyzer.schemas.analyzer_schema import (
    AnalyzeRequest,
    RepoAnalysisResult,
)
from src.ai_platform.ai.workflows.graph.repo_analysis_graph import (
    run_repo_analysis_graph,
)


router = APIRouter(
    prefix="/analyzer",
    tags=["Analyzer"]
)


@router.post("/analyze", response_model=RepoAnalysisResult)
def analyze_repo(
    body: AnalyzeRequest,
    user=Depends(get_current_user)
):
    try:
        result = run_repo_analysis_graph(body.git_url)
        return RepoAnalysisResult(**result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
