from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


@pytest.fixture()
def db_session_factory():
    """Fresh in-memory SQLite DB per test — keeps tests fast and offline.

    Postgres remains the real dev/prod database (see docker-compose.yml);
    SQLite here is a test double, not an architecture change.
    """
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session_factory, monkeypatch) -> Generator[TestClient, None, None]:
    def override_get_db():
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # run_analysis is invoked as a background task, outside FastAPI's request
    # scope, so it can't pick up the get_db override above — it builds its own
    # session from app.services.analysis_runner.SessionLocal. Patch that
    # directly so background-task DB writes land in the same test database.
    import app.services.analysis_runner as analysis_runner

    monkeypatch.setattr(analysis_runner, "SessionLocal", db_session_factory)

    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
