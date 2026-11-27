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


@router.get("", response_model=PerformanceOverviewResponse)
@router.get("/overview", response_model=PerformanceOverviewResponse)
def get_performance_overview(
    slow_only: bool = Query(default=False),
    min_duration_ms: Optional[float] = Query(default=None, ge=0.0),
    limit: int = Query(default=50, ge=1, le=200),
    service: PerformanceMonitorService = Depends(get_performance_monitor_service),
) -> PerformanceOverviewResponse:
    return service.get_overview(
        slow_only=slow_only,
        min_duration_ms=min_duration_ms,
        limit=limit,
    )


@router.get("/connections", response_model=ConnectionStatsSchema)
def get_connection_stats(
    service: PerformanceMonitorService = Depends(get_performance_monitor_service),
) -> ConnectionStatsSchema:
    return service.get_connection_stats()


@router.get("/tables", response_model=list[TableStatisticItem])
def get_table_statistics(
    service: PerformanceMonitorService = Depends(get_performance_monitor_service),
) -> list[TableStatisticItem]:
    return service.get_table_statistics()


@router.get("/slow-queries", response_model=list[SlowQueryLogItem])
def get_slow_queries(
    slow_only: bool = Query(default=False),
    min_duration_ms: Optional[float] = Query(default=None, ge=0.0),
    query_type: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    service: PerformanceMonitorService = Depends(get_performance_monitor_service),
) -> list[SlowQueryLogItem]:
    return service.get_slow_queries(
        slow_only=slow_only,
        min_duration_ms=min_duration_ms,
        query_type=query_type,
        limit=limit,
    )


@router.post("/logs", response_model=SlowQueryLogItem, status_code=status.HTTP_201_CREATED)
def record_query_performance_log(
    payload: RecordQueryLogRequest,
    service: PerformanceMonitorService = Depends(get_performance_monitor_service),
) -> SlowQueryLogItem:
    try:
        return service.record_query_log(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
