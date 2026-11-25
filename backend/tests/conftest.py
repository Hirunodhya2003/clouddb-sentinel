import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app


@pytest.fixture
def client():
    with engine.connect() as connection:
        transaction = connection.begin()

        with Session(
            bind=connection,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        ) as session:

            def override_get_db():
                yield session

            previous_overrides = app.dependency_overrides.copy()
            app.dependency_overrides[get_db] = override_get_db

            try:
                with TestClient(app) as test_client:
                    yield test_client
            finally:
                app.dependency_overrides.clear()
                app.dependency_overrides.update(previous_overrides)

                session.close()

                if transaction.is_active:
                    transaction.rollback()