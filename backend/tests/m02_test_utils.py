# Owner: Member 02 - shared helper for the category and product tests.
# Run from the backend folder with:  python -m pytest tests/test_categories.py tests/test_products.py tests/test_schema_viewer.py
import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

from m02_dev_shim import install_shims  # noqa: E402

install_shims()

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.v1.endpoints import categories, products, schema_viewer  # noqa: E402
from app.database.base import Base  # noqa: E402
from app.database.session import get_db  # noqa: E402
import app.models.category  # noqa: E402,F401
import app.models.product  # noqa: E402,F401


def make_client() -> TestClient:
    """A TestClient backed by a fresh in-memory SQLite database."""
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app = FastAPI()
    app.include_router(categories.router, prefix="/api/v1")
    app.include_router(products.router, prefix="/api/v1")
    app.include_router(schema_viewer.router, prefix="/api/v1")
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)
