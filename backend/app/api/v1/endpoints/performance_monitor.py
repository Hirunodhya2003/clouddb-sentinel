# Owner: Member 09
"""FastAPI v1 endpoints for Database Connection & Slow Query Performance Monitoring."""

from typing import Generator, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.repositories.report_repository import ReportRepository
from app.schemas.performance_monitor import (
    ConnectionStatsSchema,
    PerformanceOverviewResponse,
    RecordQueryLogRequest,
    SlowQueryLogItem,
    TableStatisticItem,
)
from app.services.performance_monitor_service import PerformanceMonitorService


def _resolve_get_db():
    try:
        from app.database.session import get_db as session_get_db

        return session_get_db
    except Exception:
        def _fallback_get_db() -> Generator[Session, None, None]:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database session dependency is not configured.",
            )
            yield  # pragma: no cover

        return _fallback_get_db


get_db = _resolve_get_db()

router = APIRouter(prefix="/performance-monitor", tags=["Performance Monitor"])


def get_performance_monitor_service(
    db: Session = Depends(get_db),
) -> PerformanceMonitorService:
    return PerformanceMonitorService(ReportRepository(db))
