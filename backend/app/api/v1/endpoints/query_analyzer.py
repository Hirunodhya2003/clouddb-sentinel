# Owner: Member 09
"""FastAPI v1 endpoints for SQL Query Optimization, EXPLAIN, and Plan Comparison."""

from typing import Generator

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.repositories.report_repository import ReportRepository
from app.schemas.performance_monitor import SlowQueryLogItem
from app.schemas.query_analyzer import (
    ExplainAnalysisResult,
    ExplainRequest,
    PlanComparisonRequest,
    PlanComparisonResponse,
    PresetQueryScenario,
)
from app.services.query_analyzer_service import QueryAnalyzerService


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

router = APIRouter(prefix="/query-analyzer", tags=["Query Analyzer"])


def get_query_analyzer_service(db: Session = Depends(get_db)) -> QueryAnalyzerService:
    return QueryAnalyzerService(ReportRepository(db))
