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


class PurchaseReportResponse(BaseModel):
    summary: PurchaseReportSummary
    items: list[PurchaseReportRow]
    total: int


class InventoryReportRow(BaseModel):
    inventory_id: int
    variant_id: int
    sku: str
    product_code: str
    product_name: str
    category_name: str
    size_name: str
    colour_name: str
    quantity_on_hand: int = 0
    reorder_level: int = 0
    cost_price: float = 0.0
    selling_price: float = 0.0
    stock_cost_value: float = 0.0
    stock_retail_value: float = 0.0
    stock_status: str = Field(..., description="IN_STOCK, LOW_STOCK, or OUT_OF_STOCK")
    last_stock_updated: Optional[datetime] = None


class InventoryReportSummary(BaseModel):
    total_variants: int = 0
    total_units_on_hand: int = 0
    low_stock_variants: int = 0
    out_of_stock_variants: int = 0
    total_cost_valuation: float = 0.0
    total_retail_valuation: float = 0.0


class InventoryReportResponse(BaseModel):
    summary: InventoryReportSummary
    items: list[InventoryReportRow]
    total: int


class BusinessSummaryResponse(BaseModel):
    completed_sales_count: int = 0
    gross_sales_revenue: float = 0.0
    total_discounts_given: float = 0.0
    pending_sales_count: int = 0
    received_purchases_count: int = 0
    total_purchase_spend: float = 0.0
    pending_purchases_count: int = 0
    estimated_net_cashflow: float = 0.0
    active_products_count: int = 0
    active_variants_count: int = 0
    total_units_in_stock: int = 0
    inventory_cost_value: float = 0.0
    inventory_retail_value: float = 0.0
    low_stock_variants_count: int = 0
    out_of_stock_variants_count: int = 0
    active_customers_count: int = 0
    active_suppliers_count: int = 0
    source: str = "computed"
