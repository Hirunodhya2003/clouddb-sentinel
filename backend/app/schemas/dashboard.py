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
