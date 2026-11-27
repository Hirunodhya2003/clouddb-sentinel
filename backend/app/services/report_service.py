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

    def get_purchase_report(
        self,
        *,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        supplier_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 100,
    ) -> PurchaseReportResponse:
        _validate_date_range(start_date, end_date)
        rows = self.repository.fetch_purchase_report(
            start_date=start_date,
            end_date=end_date,
            status=status,
            supplier_id=supplier_id,
            search=search,
            limit=limit,
        )
        items = [PurchaseReportRow(**r) for r in rows]
        received = [item for item in items if item.status.upper() == "RECEIVED"]
        pending = [item for item in items if item.status.upper() == "PENDING"]

        summary = PurchaseReportSummary(
            total_orders=len(items),
            received_orders=len(received),
            pending_orders=len(pending),
            total_units_purchased=sum(item.units_purchased for item in items),
            received_spend=round(sum(item.total_amount for item in received), 2),
            pending_commitment=round(sum(item.total_amount for item in pending), 2),
        )
        return PurchaseReportResponse(summary=summary, items=items, total=len(items))

    def get_inventory_report(
        self,
        *,
        category_id: Optional[int] = None,
        stock_status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 200,
    ) -> InventoryReportResponse:
        if stock_status and stock_status.strip().upper() not in {
            "IN_STOCK",
            "LOW_STOCK",
            "OUT_OF_STOCK",
        }:
            raise ValueError("stock_status must be one of IN_STOCK, LOW_STOCK, or OUT_OF_STOCK.")

        rows = self.repository.fetch_inventory_report(
            category_id=category_id,
            stock_status=stock_status,
            search=search,
            limit=limit,
        )
        items = [InventoryReportRow(**r) for r in rows]
        summary = InventoryReportSummary(
            total_variants=len(items),
            total_units_on_hand=sum(item.quantity_on_hand for item in items),
            low_stock_variants=sum(1 for item in items if item.stock_status == "LOW_STOCK"),
            out_of_stock_variants=sum(1 for item in items if item.stock_status == "OUT_OF_STOCK"),
            total_cost_valuation=round(sum(item.stock_cost_value for item in items), 2),
            total_retail_valuation=round(sum(item.stock_retail_value for item in items), 2),
        )
        return InventoryReportResponse(summary=summary, items=items, total=len(items))

    def get_business_summary(self) -> BusinessSummaryResponse:
        data = self.repository.fetch_business_summary()
        return BusinessSummaryResponse(**data)
