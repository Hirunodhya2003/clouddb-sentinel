# Owner: Member 09
"""Business logic service for Sales, Purchase, Inventory, and Executive Summary Reports."""

from datetime import date
from typing import Optional

from app.repositories.report_repository import ReportRepository
from app.schemas.reports import (
    BusinessSummaryResponse,
    InventoryReportResponse,
    InventoryReportRow,
    InventoryReportSummary,
    PurchaseReportResponse,
    PurchaseReportRow,
    PurchaseReportSummary,
    SalesReportResponse,
    SalesReportRow,
    SalesReportSummary,
)


def _validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> None:
    parsed_start: Optional[date] = None
    parsed_end: Optional[date] = None
    if start_date:
        try:
            parsed_start = date.fromisoformat(start_date)
        except ValueError as exc:
            raise ValueError(f"Invalid start_date '{start_date}'. Expected YYYY-MM-DD.") from exc
    if end_date:
        try:
            parsed_end = date.fromisoformat(end_date)
        except ValueError as exc:
            raise ValueError(f"Invalid end_date '{end_date}'. Expected YYYY-MM-DD.") from exc
    if parsed_start and parsed_end and parsed_start > parsed_end:
        raise ValueError("start_date cannot be later than end_date.")


class ReportService:
    """Validates report filters and computes aggregated business report summaries."""

    def __init__(self, repository: ReportRepository) -> None:
        self.repository = repository

    def get_sales_report(
        self,
        *,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
    ) -> SalesReportResponse:
        _validate_date_range(start_date, end_date)
        rows = self.repository.fetch_sales_report(
            start_date=start_date,
            end_date=end_date,
            status=status,
            search=search,
            limit=limit,
        )
        items = [SalesReportRow(**r) for r in rows]
        completed = [item for item in items if item.status.upper() == "COMPLETED"]
        net_revenue = round(sum(item.total_amount for item in completed), 2)
        avg_order = round(net_revenue / len(completed), 2) if completed else 0.0

        summary = SalesReportSummary(
            total_orders=len(items),
            completed_orders=len(completed),
            total_units_sold=sum(item.units_sold for item in items),
            gross_subtotal=round(sum(item.subtotal for item in items), 2),
            total_discounts=round(sum(item.discount_amount for item in items), 2),
            net_revenue=net_revenue,
            average_order_value=avg_order,
        )
        return SalesReportResponse(summary=summary, items=items, total=len(items))
