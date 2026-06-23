from sqlalchemy.orm import Session

from src.modules.documents.models.document import (
    Document
)


class MetadataAgent:

    @staticmethod
    def answer(
        question: str,
        db: Session,
        user_id: int
    ):

        question = question.lower()

        documents = (
            db.query(Document)
            .filter(
                Document.uploaded_by == user_id
            )
            .all()
        )

        # Total Files
        if (
            "how many files" in question
            or "file count" in question
            or "documents count" in question
        ):

            return {
                "answer":
                    f"You have uploaded {len(documents)} files.",
                "sources": []
            }

        # List Files
        if (
            "list files" in question
            or "show files" in question
            or "uploaded files" in question
            or "filenames" in question
        ):

            names = [
                d.file_name
                for d in documents
            ]

            return {
                "answer":
                    "\n".join(names),
                "sources": []
            }

        # Excel Files
        if (
            "excel" in question
            or "xlsx" in question
        ):

            files = [
                d.file_name
                for d in documents
                if d.file_name.lower().endswith(
                    (".xlsx", ".xls")
                )
            ]

            return {
                "answer":
                    "\n".join(files)
                    if files
                    else "No Excel files found.",
                "sources": []
            }

        # PDF Files
        if "pdf" in question:

            files = [
                d.file_name
                for d in documents
                if d.file_name.lower().endswith(
                    ".pdf"
                )
            ]

            return {
                "answer":
                    "\n".join(files)
                    if files
                    else "No PDF files found.",
                "sources": []
            }

        return {
            "answer":
                "Metadata information not found.",
            "sources": []
        }