# Owner: Member 08
"""
FastAPI v1 endpoints for Member 08 Audit Reports:
  - GET /api/v1/audit-reports
  - GET /api/v1/audit-reports/stock
"""

from typing import Generator, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import app.database.session as _db_session_mod
from app.repositories.stock_movement_repository import StockMovementRepository
from app.schemas.audit_reports import AuditReportResponse
from app.services.audit_report_service import AuditReportService


def _fallback_get_db() -> Generator[Session, None, None]:
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Database session dependency (app.database.session.get_db) is not configured."
        ),
    )
    yield  # pragma: no cover


if not hasattr(_db_session_mod, "get_db"):
    setattr(_db_session_mod, "get_db", _fallback_get_db)

get_db = getattr(_db_session_mod, "get_db")

router = APIRouter(prefix="/audit-reports", tags=["Audit Reports"])


def get_audit_report_service(
    db: Session = Depends(get_db),
) -> AuditReportService:
    repo = StockMovementRepository(db)
    return AuditReportService(repo)


@router.get(
    "",
    response_model=AuditReportResponse,
    summary="Get operational and stock audit reports",
)
def get_audit_reports(
    search: Optional[str] = Query(
        default=None, description="Search by reference, SKU, product, or summary"
    ),
    source_table: Optional[str] = Query(
        default=None, description="Filter by source table"
    ),
    action_type: Optional[str] = Query(
        default=None, description="Filter by action_type"
    ),
    outcome: Optional[str] = Query(
        default=None, description="Filter by outcome (COMMITTED, NEEDS_REVIEW, etc.)"
    ),
    actor_user_id: Optional[int] = Query(
        default=None, description="Filter by user_id"
    ),
    variant_id: Optional[int] = Query(
        default=None, description="Filter by variant_id"
    ),
    from_date: Optional[str] = Query(
        default=None, description="Start date filter (YYYY-MM-DD)"
    ),
    to_date: Optional[str] = Query(
        default=None, description="End date filter (YYYY-MM-DD)"
    ),
    service: AuditReportService = Depends(get_audit_report_service),
) -> AuditReportResponse:
    return service.get_audit_reports(
        search=search,
        source_table=source_table,
        action_type=action_type,
        outcome=outcome,
        actor_user_id=actor_user_id,
        variant_id=variant_id,
        from_date=from_date,
        to_date=to_date,
    )


@router.get(
    "/stock",
    response_model=AuditReportResponse,
    summary="Get stock-specific audit reports",
)
def get_stock_audit_reports(
    search: Optional[str] = Query(
        default=None, description="Search by reference, SKU, product, or summary"
    ),
    source_table: Optional[str] = Query(
        default=None, description="Filter by source table"
    ),
    action_type: Optional[str] = Query(
        default=None, description="Filter by action_type"
    ),
    outcome: Optional[str] = Query(
        default=None, description="Filter by outcome"
    ),
    actor_user_id: Optional[int] = Query(
        default=None, description="Filter by user_id"
    ),
    variant_id: Optional[int] = Query(
        default=None, description="Filter by variant_id"
    ),
    from_date: Optional[str] = Query(
        default=None, description="Start date filter (YYYY-MM-DD)"
    ),
    to_date: Optional[str] = Query(
        default=None, description="End date filter (YYYY-MM-DD)"
    ),
    service: AuditReportService = Depends(get_audit_report_service),
) -> AuditReportResponse:
    return service.get_stock_audit_reports(
        search=search,
        source_table=source_table,
        action_type=action_type,
        outcome=outcome,
        actor_user_id=actor_user_id,
        variant_id=variant_id,
        from_date=from_date,
        to_date=to_date,
    )
