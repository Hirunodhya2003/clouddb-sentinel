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


def get_dashboard_service(db: Session = Depends(get_db)) -> DashboardService:
    return DashboardService(DashboardRepository(db))


@router.get("", response_model=DashboardOverviewResponse)
@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(
    trend_days: int = Query(default=14, ge=1, le=90),
    recent_limit: int = Query(default=10, ge=1, le=50),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardOverviewResponse:
    return service.get_overview(trend_days=trend_days, recent_limit=recent_limit)


@router.get("/summary", response_model=list[SummaryMetricCard])
def get_dashboard_summary_cards(
    service: DashboardService = Depends(get_dashboard_service),
) -> list[SummaryMetricCard]:
    return service.get_summary_cards()


@router.get("/sales-chart", response_model=list[SalesTrendPoint])
def get_dashboard_sales_chart(
    days: int = Query(default=14, ge=1, le=90),
    service: DashboardService = Depends(get_dashboard_service),
) -> list[SalesTrendPoint]:
    return service.get_sales_chart(days=days)


@router.get("/inventory-chart", response_model=list[InventoryCategorySlice])
def get_dashboard_inventory_chart(
    service: DashboardService = Depends(get_dashboard_service),
) -> list[InventoryCategorySlice]:
    return service.get_inventory_chart()


@router.get("/recent-transactions", response_model=list[RecentTransactionItem])
def get_dashboard_recent_transactions(
    limit: int = Query(default=10, ge=1, le=50),
    service: DashboardService = Depends(get_dashboard_service),
) -> list[RecentTransactionItem]:
    return service.get_recent_transactions(limit=limit)
