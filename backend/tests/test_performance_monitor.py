# Owner: Member 09
"""Unit and API tests for Member 09 Performance Monitor, Metrics, Middleware, and Health Check."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.v1.endpoints import performance_monitor as pm_ep  # noqa: E402
from app.database.base import Base  # noqa: E402
import app.models.query_performance_log  # noqa: E402,F401
from app.monitoring import health_check  # noqa: E402
from app.monitoring.metrics import MetricsCollector, metrics_collector  # noqa: E402
from app.monitoring.middleware import (  # noqa: E402
    PerformanceMonitoringMiddleware,
    attach_sqlalchemy_query_timer,
)


@pytest.fixture
def monitor_client():
    metrics_collector.reset()
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    attach_sqlalchemy_query_timer(engine, collector=metrics_collector)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        with TestingSession() as db:
            yield db

    app = FastAPI()
    app.add_middleware(PerformanceMonitoringMiddleware, collector=metrics_collector)
    app.include_router(pm_ep.router, prefix="/api/v1")
    app.include_router(health_check.router)
    app.dependency_overrides[pm_ep.get_db] = override_get_db
    app.dependency_overrides[health_check.get_db] = override_get_db
    return TestClient(app)


def test_record_and_filter_slow_query_logs(monitor_client):
    fast_res = monitor_client.post(
        "/api/v1/performance-monitor/logs",
        json={
            "query_type": "SELECT",
            "query_text": "SELECT sale_id FROM sales WHERE sale_id = 1",
            "execution_time_ms": 8.5,
            "rows_examined": 1,
            "rows_returned": 1,
            "endpoint": "/api/v1/sales/1",
            "slow_threshold_ms": 100.0,
        },
    )
    assert fast_res.status_code == 201
    assert fast_res.json()["is_slow_query"] is False
    assert "X-Response-Time-Ms" in fast_res.headers

    slow_res = monitor_client.post(
        "/api/v1/performance-monitor/logs",
        json={
            "query_type": "SELECT",
            "query_text": "SELECT * FROM inventory WHERE quantity_on_hand <= reorder_level",
            "execution_time_ms": 245.75,
            "rows_examined": 5000,
            "rows_returned": 12,
            "endpoint": "/api/v1/inventory/low-stock",
            "slow_threshold_ms": 100.0,
        },
    )
    assert slow_res.status_code == 201
    assert slow_res.json()["is_slow_query"] is True

    only_slow = monitor_client.get(
        "/api/v1/performance-monitor/slow-queries",
        params={"slow_only": True},
    )
    assert only_slow.status_code == 200
    items = only_slow.json()
    assert len(items) == 1
    assert items[0]["execution_time_ms"] == 245.75


def test_performance_overview_connections_and_tables(monitor_client):
    overview = monitor_client.get("/api/v1/performance-monitor/overview")
    assert overview.status_code == 200
    body = overview.json()
    assert body["connections"]["threads_connected"] >= 1
    assert any(t["table_name"] == "query_performance_logs" for t in body["table_statistics"])

    conns = monitor_client.get("/api/v1/performance-monitor/connections")
    assert conns.status_code == 200

    tables = monitor_client.get("/api/v1/performance-monitor/tables")
    assert tables.status_code == 200
    assert len(tables.json()) >= 1


def test_health_check_and_prometheus_metrics_exposition(monitor_client):
    health = monitor_client.get("/health/detailed")
    assert health.status_code == 200
    hbody = health.json()
    assert hbody["status"] == "ok"
    assert hbody["database"]["reachable"] is True

    prom = monitor_client.get("/metrics")
    assert prom.status_code == 200
    assert "clouddb_http_requests_total" in prom.text
    assert "clouddb_db_queries_total" in prom.text

    isolated = MetricsCollector()
    isolated.record_http_request("GET", "/api/v1/dashboard", 200, 12.4)
    snap = isolated.snapshot()
    assert snap["http_requests_total"] == 1
    assert snap["http_5xx_errors_total"] == 0
