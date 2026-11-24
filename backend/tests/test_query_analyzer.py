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

    def override_get_db():
        with TestingSession() as db:
            yield db

    app = FastAPI()
    app.include_router(qa_ep.router, prefix="/api/v1")
    app.dependency_overrides[qa_ep.get_db] = override_get_db
    return TestClient(app)


def test_presets_endpoint_returns_curated_scenarios(qa_client):
    res = qa_client.get("/api/v1/query-analyzer/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 3
    assert presets[0]["scenario_id"] == "sales-date-range"


def test_explain_rejects_mutating_and_multistatement_sql(qa_client):
    for unsafe_sql in [
        "DROP TABLE sales",
        "DELETE FROM sales WHERE sale_id = 1",
        "UPDATE sales SET total_amount = 0",
        "SELECT * FROM sales; SELECT * FROM sales",
    ]:
        res = qa_client.post("/api/v1/query-analyzer/explain", json={"sql": unsafe_sql})
        assert res.status_code == 400


def test_explain_and_explain_analyze_log_telemetry_and_detect_anti_patterns(qa_client):
    res = qa_client.post(
        "/api/v1/query-analyzer/explain",
        json={
            "sql": "SELECT * FROM sales WHERE invoice_number LIKE '%INV-001%'",
            "analyze": True,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["mode"] == "EXPLAIN_ANALYZE"
    assert body["analyze_tree"] is not None
    assert len(body["query_fingerprint"]) == 64
    assert any("SELECT *" in tip for tip in body["optimization_suggestions"])
    assert any("wildcard" in tip.lower() for tip in body["optimization_suggestions"])

    hist = qa_client.get("/api/v1/query-analyzer/history")
    assert hist.status_code == 200
    assert len(hist.json()) == 1


def test_compare_plans_identifies_index_backed_optimization(qa_client):
    res = qa_client.post(
        "/api/v1/query-analyzer/compare",
        json={
            "original_sql": "SELECT * FROM sales WHERE SUBSTR(sale_date, 1, 4) = '2026'",
            "optimized_sql": (
                "SELECT sale_id, invoice_number, sale_date, total_amount "
                "FROM sales WHERE sale_date >= '2026-01-01' AND sale_date < '2027-01-01'"
            ),
            "analyze": True,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["winner"] == "optimized"
    assert body["optimized"]["uses_index"] is True
    assert body["estimated_rows_delta"] > 0
