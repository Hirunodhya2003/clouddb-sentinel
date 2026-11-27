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


@router.get("/presets", response_model=list[PresetQueryScenario])
def list_preset_scenarios(
    service: QueryAnalyzerService = Depends(get_query_analyzer_service),
) -> list[PresetQueryScenario]:
    return service.get_presets()


@router.post("/explain", response_model=ExplainAnalysisResult)
def explain_sql_query(
    payload: ExplainRequest,
    service: QueryAnalyzerService = Depends(get_query_analyzer_service),
) -> ExplainAnalysisResult:
    try:
        return service.analyze_query(
            payload.sql,
            analyze=payload.analyze,
            endpoint=payload.endpoint,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database could not explain query: {exc}",
        ) from exc


@router.post("/compare", response_model=PlanComparisonResponse)
def compare_sql_plans(
    payload: PlanComparisonRequest,
    service: QueryAnalyzerService = Depends(get_query_analyzer_service),
) -> PlanComparisonResponse:
    try:
        return service.compare_plans(
            payload.original_sql,
            payload.optimized_sql,
            analyze=payload.analyze,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database could not compare query plans: {exc}",
        ) from exc


@router.get("/history", response_model=list[SlowQueryLogItem])
def get_analyzed_query_history(
    limit: int = Query(default=20, ge=1, le=100),
    service: QueryAnalyzerService = Depends(get_query_analyzer_service),
) -> list[SlowQueryLogItem]:
    return service.get_recent_history(limit=limit)
