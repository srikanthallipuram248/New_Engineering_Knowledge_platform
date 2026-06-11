from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from src.core.config import settings
from urllib.parse import quote_plus

user = quote_plus(settings.POSTGRES_USER)
password = quote_plus(settings.POSTGRES_PASSWORD)

DATABASE_URL = (
    # f"postgresql://{settings.POSTGRES_USER}:"
    # f"{password}@"
    # f"{settings.POSTGRES_HOST}:"
    # f"{settings.POSTGRES_PORT}/"
    # f"{settings.POSTGRES_DB}"
    f"postgresql+psycopg2://{user}:{password}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}"
    f"/{settings.POSTGRES_DB}"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()