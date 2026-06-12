from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.database import Base, engine
from src.modules.users.models.user import User  # IMPORTANT

from src.modules.auth.api.auth_router import router as auth_router

from src.modules.users.api.users_router import router as users_router

from src.modules.documents.api.document_router import router as document_router

from src.modules.chat.api.chat_router import (
    router as chat_router
)

from src.modules.analyzer.api.analyzer_router import (
    router as analyzer_router
)

from src.modules.documents.services.vector_store_service import (
    VectorStoreService
)

#CREATE TABLES
Base.metadata.create_all(
    bind=engine
)

app = FastAPI(title="Engineering Knowledge platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.on_event("startup")
# def startup():
#     VectorStoreService().create_collection()


app.include_router(
    auth_router,
    prefix="/api/v1"
)

#Get current user
app.include_router(
    users_router,
    prefix="/api/v1"
)

#Document upload router
app.include_router(
    document_router,
    prefix="/api/v1"
)

#chat router
app.include_router(
    chat_router,
    prefix="/api/v1"
)


#Analyzer router (Agent 1 — GitHub repo analyzer)
app.include_router(
    analyzer_router,
    prefix="/api/v1"
)


@app.get("/")
def root():
    return {"message": "API Running"}

