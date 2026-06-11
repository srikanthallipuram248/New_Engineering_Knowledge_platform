from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

from src.core.database import Base
from src.core.config import settings

from src.modules.users.models.user import User
from src.modules.documents.models.document import Document
from src.modules.documents.models.document_chunk import DocumentChunk


from urllib.parse import quote_plus




config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_url():
    password = quote_plus(settings.POSTGRES_PASSWORD)

    return (
        f"postgresql+psycopg2://{settings.POSTGRES_USER}:"
        f"{password}@{settings.POSTGRES_HOST}:"
        f"{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )


def run_migrations_offline():
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()