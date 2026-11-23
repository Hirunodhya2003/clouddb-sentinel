# Owner: Member 09
"""Application, database connectivity, and Prometheus metrics health check endpoints."""

import time
from datetime import datetime, timezone
from typing import Any, Generator

from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.monitoring.metrics import metrics_collector


def _resolve_get_db():
    try:
        from app.database.session import get_db as session_get_db

        return session_get_db
    except Exception:
        def _unavailable_db() -> Generator[Session, None, None]:
            yield None  # type: ignore[misc]

        return _unavailable_db


get_db = _resolve_get_db()

router = APIRouter(tags=["Monitoring & Health"])


def check_database_health(db: Session | None) -> dict[str, Any]:
    """Execute a lightweight SELECT 1 probe and return connectivity and latency."""
    if db is None:
        return {
            "status": "unavailable",
            "reachable": False,
            "latency_ms": None,
            "error": "Database session is not configured",
        }

    started = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - started) * 1000.0, 3)
        return {
            "status": "healthy",
            "reachable": True,
            "latency_ms": latency_ms,
            "error": None,
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - started) * 1000.0, 3)
        return {
            "status": "unhealthy",
            "reachable": False,
            "latency_ms": latency_ms,
            "error": str(exc),
        }


def build_health_report(db: Session | None) -> dict[str, Any]:
    db_status = check_database_health(db)
    metrics = metrics_collector.snapshot()
    overall = "ok" if db_status["reachable"] else "degraded"
    return {
        "status": overall,
        "service": "clouddb-sentinel-api",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "metrics": metrics,
    }


@router.get("/health/detailed")
def detailed_health_check(db: Session | None = Depends(get_db)) -> dict[str, Any]:
    return build_health_report(db)


@router.get("/metrics")
def prometheus_metrics() -> Response:
    payload = metrics_collector.render_prometheus_text()
    return Response(
        content=payload,
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )
