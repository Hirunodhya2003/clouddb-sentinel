# Owner: Member 09
"""Unit and API tests for Member 09 Query Analyzer (EXPLAIN, EXPLAIN ANALYZE, Plan Comparison)."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.v1.endpoints import query_analyzer as qa_ep  # noqa: E402
from app.database.base import Base  # noqa: E402
import app.models.query_performance_log  # noqa: E402,F401


def _seed_analyzer_db(engine) -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE sales (
                    sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_number TEXT NOT NULL UNIQUE,
                    sale_date TEXT NOT NULL,
                    status TEXT NOT NULL,
                    total_amount NUMERIC NOT NULL
                )
                """
            )
        )
        conn.execute(text("CREATE INDEX idx_sales_date ON sales (sale_date)"))
        conn.execute(text("CREATE INDEX idx_sales_status ON sales (status)"))
        for i in range(1, 15):
            conn.execute(
                text(
                    "INSERT INTO sales (invoice_number, sale_date, status, total_amount) "
                    "VALUES (:inv, :dt, 'COMPLETED', :amt)"
                ),
                {"inv": f"INV-{i:03d}", "dt": f"2026-11-{i:02d} 10:00:00", "amt": 1500 * i},
            )


@pytest.fixture
def qa_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _seed_analyzer_db(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
