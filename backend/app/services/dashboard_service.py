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
