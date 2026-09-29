import os
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session

# Support PostgreSQL or SQLite fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./concept_xray.db")

# SQLite needs connect_args for multithreading
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
)

def init_db() -> None:
    """Create tables if they don't exist."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Dependency injection session generator for FastAPI routes."""
    with Session(engine) as session:
        yield session
