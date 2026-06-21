from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.shared.dependencies import get_current_user
from src.modules.analyzer.schemas.analyzer_schema import (
    AnalyzeRequest,
    RepoAnalysisResult,
)
from src.ai_platform.ai.workflows.graph.repo_analysis_graph import (
    run_repo_analysis_graph,
)
from src.modules.analyzer.services.repo_indexer_service import (
    get_or_create_repo_document,
    save_repo_chunks,
    embed_and_index_repo_chunks,
)


router = APIRouter(
    prefix="/analyzer",
    tags=["Analyzer"]
)


@router.post("/analyze", response_model=RepoAnalysisResult)
def analyze_repo(
    body: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    try:
        result, indexable_files = run_repo_analysis_graph(body.git_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")

    # Index the repo into the same knowledge base Agent 2 (chat) searches,
    # so the user can ask follow-up questions about it. Document creation +
    # chunk splitting are fast (just DB writes); embedding generation is
    # the slow part, so it's deferred to a background task and doesn't
    # delay this response.
    try:
        document, is_new = get_or_create_repo_document(
            db=db,
            git_url=body.git_url,
            repo_name=result.get("repo_name", ""),
            user=user,
        )
        if is_new:
            chunk_count = save_repo_chunks(
                db=db,
                document_id=document.id,
                indexable_files=indexable_files,
            )
            if chunk_count:
                background_tasks.add_task(embed_and_index_repo_chunks, document.id)
        result["document_id"] = document.id
    except Exception:
        # Indexing is a bonus on top of the analysis — never fail the
        # analysis response because of it.
        result["document_id"] = None

    return RepoAnalysisResult(**result)
