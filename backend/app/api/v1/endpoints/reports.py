# Owner: Member 09
"""FastAPI v1 endpoints for Sales, Purchase, Inventory, and Business Summary Reports."""

from typing import Generator, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.repositories.report_repository import ReportRepository
from app.schemas.reports import (
    BusinessSummaryResponse,
    InventoryReportResponse,
    PurchaseReportResponse,
    SalesReportResponse,
)
from app.services.report_service import ReportService


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

router = APIRouter(prefix="/reports", tags=["Reports"])


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    return ReportService(ReportRepository(db))


@router.get("/sales", response_model=SalesReportResponse)
def get_sales_report(
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    service: ReportService = Depends(get_report_service),
) -> SalesReportResponse:
    try:
        return service.get_sales_report(
            start_date=start_date,
            end_date=end_date,
            status=status_filter,
            search=search,
            limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/purchases", response_model=PurchaseReportResponse)
def get_purchase_report(
    start_date: Optional[str] = Query(default=None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="End date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    supplier_id: Optional[int] = Query(default=None, gt=0),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    service: ReportService = Depends(get_report_service),
) -> PurchaseReportResponse:
    try:
        return service.get_purchase_report(
            start_date=start_date,
            end_date=end_date,
            status=status_filter,
            supplier_id=supplier_id,
            search=search,
            limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/inventory", response_model=InventoryReportResponse)
def get_inventory_report(
    category_id: Optional[int] = Query(default=None, gt=0),
    stock_status: Optional[str] = Query(default=None, description="IN_STOCK, LOW_STOCK, or OUT_OF_STOCK"),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=500),
    service: ReportService = Depends(get_report_service),
) -> InventoryReportResponse:
    try:
        return service.get_inventory_report(
            category_id=category_id,
            stock_status=stock_status,
            search=search,
            limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/business-summary", response_model=BusinessSummaryResponse)
def get_business_summary(
    service: ReportService = Depends(get_report_service),
) -> BusinessSummaryResponse:
    return service.get_business_summary()
