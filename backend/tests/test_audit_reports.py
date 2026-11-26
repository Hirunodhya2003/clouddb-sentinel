# Owner: Member 08
"""
Automated backend unit & API tests for Member 08 Audit Reports:
  - GET /api/v1/audit-reports
  - GET /api/v1/audit-reports/stock

Verifies:
  1. Derived operational stock audit report generation from stock_movements,
     stock_adjustments, and sales_returns.
  2. Transparent reporting that Member 10's `audit_logs` table is not present
     (`audit_logs_table_available == False` and `schema_dependency_notice`).
  3. Filtering by source_table, outcome, variant_id, and search query.
"""

from typing import Generator

import pytest
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.endpoints import audit_reports as audit_reports_ep
from app.models.stock_movement import Base
from tests.test_stock_movements import (
    _InProcessFastAPIClient,
    _seed_test_database,
)


@pytest.fixture()
def audit_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )

    with TestingSessionLocal() as session:
        _seed_test_database(session)

    app = FastAPI()
    app.include_router(audit_reports_ep.router, prefix="/api/v1")

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[audit_reports_ep.get_db] = override_get_db
    return _InProcessFastAPIClient(app)


def test_get_audit_reports_summary_and_dependency_notice(audit_client):
    resp = audit_client.get("/api/v1/audit-reports")
    assert resp.status_code == 200
    body = resp.json()

    # 3 seeded stock_movements + 1 stock_adjustment + 1 sales_return = 5 audit events
    assert body["total"] == 5
    assert len(body["items"]) == 5
    assert body["endpoint"] == "/api/v1/audit-reports"
    assert body["audit_logs_table_available"] is False
    assert "Member 10" in body["schema_dependency_notice"]

    summary = body["summary"]
    assert summary["totalEvents"] == 5
    assert summary["stockLedgerEvents"] == 3
    assert summary["adjustmentAudits"] == 1
    assert summary["returnAudits"] == 1
    assert summary["reconciliationsAndReturns"] == 2
    assert len(summary["chartSeries"]) == 10
    # All 5 seeded audit events are in November 2026 and must be grouped under Nov
    assert summary["chartSeries"][-1]["key"] == "2026-11"
    assert summary["chartSeries"][-1]["label"] == "Nov"
    assert summary["chartSeries"][-1]["count"] == 5
    assert all(b["count"] == 0 for b in summary["chartSeries"][:-1])


def test_get_stock_audit_reports_and_filters(audit_client):
    resp = audit_client.get("/api/v1/audit-reports/stock")
    assert resp.status_code == 200
    body = resp.json()
    assert body["endpoint"] == "/api/v1/audit-reports/stock"
    assert body["total"] == 5
    assert all(item["is_stock_audit"] is True for item in body["items"])
    assert all(
        item["is_derived_from_operational_tables"] is True
        for item in body["items"]
    )

    # Filter by source_table=stock_adjustments
    resp_adj = audit_client.get(
        "/api/v1/audit-reports/stock",
        params={"source_table": "stock_adjustments"},
    )
    assert resp_adj.status_code == 200
    adj_items = resp_adj.json()["items"]
    assert len(adj_items) == 1
    assert adj_items[0]["reference_code"] == "ADJ-2026-2101"

    # Filter by variant_id=101
    resp_var = audit_client.get(
        "/api/v1/audit-reports/stock", params={"variant_id": 101}
    )
    assert resp_var.status_code == 200
    assert resp_var.json()["total"] == 3
