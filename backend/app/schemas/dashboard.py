# Owner: Member 09
"""Pydantic response schemas for the Dashboard API."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SummaryMetricCard(BaseModel):
    key: str
    label: str
    value: float
    formatted_value: str
    subtitle: str
    trend: Literal["up", "down", "neutral"] = "neutral"
    badge: Optional[str] = None


class SalesTrendPoint(BaseModel):
    period: str = Field(..., description="ISO date or YYYY-MM bucket")
    label: str
    orders_count: int = 0
    revenue: float = 0.0
    discounts: float = 0.0


class InventoryCategorySlice(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    product_count: int = 0
    variant_count: int = 0
    units_on_hand: int = 0
    retail_value: float = 0.0
    cost_value: float = 0.0
    low_stock_count: int = 0


class RecentTransactionItem(BaseModel):
    transaction_type: Literal["SALE", "PURCHASE", "MOVEMENT"]
    record_id: int
    reference_number: str
    counterparty: str
    amount: float = 0.0
    quantity: Optional[int] = None
    status: str
    occurred_at: Optional[datetime] = None


class DashboardOverviewResponse(BaseModel):
    summary_cards: list[SummaryMetricCard]
    sales_chart: list[SalesTrendPoint]
    inventory_chart: list[InventoryCategorySlice]
    recent_transactions: list[RecentTransactionItem]
    generated_at: datetime
