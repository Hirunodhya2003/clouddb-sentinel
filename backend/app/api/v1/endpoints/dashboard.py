# Owner: Member 09
"""FastAPI v1 endpoints for the Executive Dashboard."""

from typing import Generator

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    InventoryCategorySlice,
    RecentTransactionItem,
    SalesTrendPoint,
    SummaryMetricCard,
)
from app.services.dashboard_service import DashboardService


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

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
