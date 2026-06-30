from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.modules.chat.models.admin_models import FailedQuery
from src.modules.chat.models.chat_message import ChatMessage
from src.modules.documents.models.document import Document
from src.modules.documents.models.document_chunk import DocumentChunk
from src.modules.users.models.user import User
from src.shared.dependencies import get_current_user


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


def require_admin(
    current_user: User = Depends(get_current_user)
):
    role = (current_user.role or "").strip().lower()
    if role not in {"admin", "administrator"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = (
        db.query(func.count(User.id))
        .filter(User.is_active == True)
        .scalar()
        or 0
    )
    total_repositories = db.query(func.count(Document.id)).scalar() or 0
    total_chunks = db.query(func.count(DocumentChunk.id)).scalar() or 0
    total_messages = db.query(func.count(ChatMessage.id)).scalar() or 0
    failed_queries_count = db.query(func.count(FailedQuery.id)).scalar() or 0

    repository_rows = (
        db.query(
            Document,
            User.full_name,
            User.email,
            func.count(DocumentChunk.id).label("chunk_count")
        )
        .join(User, User.id == Document.uploaded_by)
        .outerjoin(DocumentChunk, DocumentChunk.document_id == Document.id)
        .group_by(Document.id, User.full_name, User.email)
        .order_by(Document.created_at.desc())
        .all()
    )

    user_rows = (
        db.query(User)
        .order_by(User.id.desc())
        .limit(50)
        .all()
    )

    message_rows = (
        db.query(ChatMessage, User.full_name, User.email)
        .join(User, User.id == ChatMessage.user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(12)
        .all()
    )

    failed_query_rows = (
        db.query(FailedQuery, User.full_name, User.email, Document.file_name)
        .join(User, User.id == FailedQuery.user_id)
        .outerjoin(Document, Document.id == FailedQuery.repository_id)
        .order_by(FailedQuery.timestamp.desc())
        .limit(12)
        .all()
    )

    return {
        "stats": {
            "total_users": total_users,
            "active_users": active_users,
            "total_repositories": total_repositories,
            "total_chunks": total_chunks,
            "total_messages": total_messages,
            "failed_queries": failed_queries_count
        },
        "repositories": [
            {
                "id": doc.id,
                "title": doc.title,
                "file_name": doc.file_name,
                "file_type": doc.file_type,
                "created_at": doc.created_at,
                "uploaded_by": doc.uploaded_by,
                "uploaded_by_name": full_name,
                "uploaded_by_email": email,
                "chunk_count": chunk_count
            }
            for doc, full_name, email, chunk_count in repository_rows
        ],
        "users": [
            {
                "id": user.id,
                "name": user.full_name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active
            }
            for user in user_rows
        ],
        "recent_messages": [
            {
                "id": message.id,
                "user_id": message.user_id,
                "user_name": full_name,
                "user_email": email,
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at
            }
            for message, full_name, email in message_rows
        ],
        "failed_queries_list": [
            {
                "id": failed_query.id,
                "question": failed_query.question,
                "user_id": failed_query.user_id,
                "user_name": full_name,
                "user_email": email,
                "repository_id": failed_query.repository_id,
                "repository_name": file_name,
                "failure_reason": failed_query.failure_reason,
                "timestamp": failed_query.timestamp
            }
            for failed_query, full_name, email, file_name in failed_query_rows
        ]
    }
