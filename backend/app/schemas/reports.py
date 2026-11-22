# Owner: Member 09
"""Pydantic request/response schemas for Business Reports APIs."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SalesReportRow(BaseModel):
    sale_id: int
    invoice_number: str
    sale_date: Optional[datetime] = None
    customer_name: str
    status: str
    items_count: int = 0
    units_sold: int = 0
    subtotal: float = 0.0
    discount_amount: float = 0.0
    total_amount: float = 0.0


class SalesReportSummary(BaseModel):
    total_orders: int = 0
    completed_orders: int = 0
    total_units_sold: int = 0
    gross_subtotal: float = 0.0
    total_discounts: float = 0.0
    net_revenue: float = 0.0
    average_order_value: float = 0.0


class SalesReportResponse(BaseModel):
    summary: SalesReportSummary
    items: list[SalesReportRow]
    total: int


class PurchaseReportRow(BaseModel):
    purchase_id: int
    invoice_number: str
    purchase_date: Optional[datetime] = None
    supplier_name: str
    status: str
    items_count: int = 0
    units_purchased: int = 0
    total_amount: float = 0.0


class PurchaseReportSummary(BaseModel):
    total_orders: int = 0
    received_orders: int = 0
    pending_orders: int = 0
    total_units_purchased: int = 0
    received_spend: float = 0.0
    pending_commitment: float = 0.0
