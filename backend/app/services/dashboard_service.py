# Owner: Member 09
"""Business logic service for the CloudDB Sentinel Executive Dashboard."""

from datetime import datetime, timezone

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    InventoryCategorySlice,
    RecentTransactionItem,
    SalesTrendPoint,
    SummaryMetricCard,
)


def _fmt_currency(amount: float) -> str:
    return f"LKR {amount:,.2f}"


class DashboardService:
    """Composes KPI summary cards, trend series, inventory slices, and recent transactions."""

    def __init__(self, repository: DashboardRepository) -> None:
        self.repository = repository

    def get_summary_cards(self) -> list[SummaryMetricCard]:
        totals = self.repository.get_kpi_totals()
        revenue = float(totals["gross_sales_revenue"])
        sales_cnt = int(totals["completed_sales_count"])
        spend = float(totals["total_purchase_spend"])
        purch_cnt = int(totals["received_purchases_count"])
        units = int(totals["total_units_in_stock"])
        inv_value = float(totals["inventory_retail_value"])
        low_stock = int(totals["low_stock_variants_count"])
        products_cnt = int(totals["active_products_count"])
        customers_cnt = int(totals["active_customers_count"])

        return [
            SummaryMetricCard(
                key="gross_revenue",
                label="Completed Sales Revenue",
                value=round(revenue, 2),
                formatted_value=_fmt_currency(revenue),
                subtitle=f"{sales_cnt} completed invoices",
                trend="up" if revenue > 0 else "neutral",
                badge="Sales",
            ),
            SummaryMetricCard(
                key="purchase_spend",
                label="Procurement Spend",
                value=round(spend, 2),
                formatted_value=_fmt_currency(spend),
                subtitle=f"{purch_cnt} received purchase orders",
                trend="neutral",
                badge="Purchases",
            ),
            SummaryMetricCard(
                key="inventory_valuation",
                label="Inventory Retail Value",
                value=round(inv_value, 2),
                formatted_value=_fmt_currency(inv_value),
                subtitle=f"{units:,} units across {products_cnt} active products",
                trend="up" if units > 0 else "neutral",
                badge="Inventory",
            ),
            SummaryMetricCard(
                key="low_stock_alerts",
                label="Low / Out-of-Stock Variants",
                value=float(low_stock),
                formatted_value=str(low_stock),
                subtitle=(
                    f"{customers_cnt} active customers served"
                    if low_stock == 0
                    else f"{low_stock} SKU(s) at or below reorder level"
                ),
                trend="down" if low_stock > 0 else "up",
                badge="Action Needed" if low_stock > 0 else "Healthy",
            ),
        ]

    def get_sales_chart(self, days: int = 14) -> list[SalesTrendPoint]:
        rows = self.repository.get_sales_trend(limit=days)
        return [SalesTrendPoint(**row) for row in rows]

    def get_inventory_chart(self) -> list[InventoryCategorySlice]:
        rows = self.repository.get_inventory_by_category()
        return [InventoryCategorySlice(**row) for row in rows]

    def get_recent_transactions(self, limit: int = 10) -> list[RecentTransactionItem]:
        rows = self.repository.get_recent_transactions(limit=limit)
        return [RecentTransactionItem(**row) for row in rows]

    def get_overview(self, trend_days: int = 14, recent_limit: int = 10) -> DashboardOverviewResponse:
        return DashboardOverviewResponse(
            summary_cards=self.get_summary_cards(),
            sales_chart=self.get_sales_chart(days=trend_days),
            inventory_chart=self.get_inventory_chart(),
            recent_transactions=self.get_recent_transactions(limit=recent_limit),
            generated_at=datetime.now(timezone.utc),
        )
