# Owner: Member 08
"""
Pydantic v2 request and response schemas for Member 08:
  - StockMovementResponse
  - StockAdjustmentItemCreate, StockAdjustmentCreate
  - StockAdjustmentItemResponse, StockAdjustmentResponse
  - ReturnItemCreate, ReturnCreate
  - ReturnItemResponse, ReturnResponse
"""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

MovementType = Literal[
    "PURCHASE",
    "SALE",
    "CUSTOMER_RETURN",
    "SUPPLIER_RETURN",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
    "DAMAGE",
]

AdjustmentType = Literal[
    "PHYSICAL_COUNT",
    "DAMAGE",
    "LOSS",
    "CORRECTION",
    "OTHER",
]

AdjustmentStatus = Literal[
    "PENDING",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
]

ReturnStatus = Literal[
    "PENDING",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
]


class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    movement_id: int
    variant_id: int
    movement_type: MovementType
    quantity: int = Field(gt=0)
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    movement_date: datetime
    notes: Optional[str] = None
    sku: Optional[str] = None
    product_name: Optional[str] = None
    category_name: Optional[str] = None
    size_name: Optional[str] = None
    colour_name: Optional[str] = None


class StockAdjustmentItemCreate(BaseModel):
    """
    Request schema for stock_adjustment_items.
    Note: quantity_difference is a MySQL GENERATED ALWAYS STORED column
    and must NOT be submitted manually (extra='forbid').
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    variant_id: int = Field(gt=0)
    quantity_before: Optional[int] = Field(default=None, ge=0)
    quantity_after: int = Field(ge=0)
    item_reason: Optional[str] = Field(default=None, max_length=255)

    @field_validator("item_reason", mode="before")
    @classmethod
    def normalize_item_reason(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped if stripped else None
        return value


class StockAdjustmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    adjustment_reference: str = Field(min_length=1, max_length=50)
    adjustment_date: Optional[datetime] = None
    adjustment_type: AdjustmentType
    reason: str = Field(min_length=1)
    created_by: Optional[int] = Field(default=None, gt=0)
    items: List[StockAdjustmentItemCreate] = Field(min_length=1)


class StockAdjustmentItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    adjustment_item_id: int
    adjustment_id: int
    variant_id: int
    quantity_before: int
    quantity_after: int
    quantity_difference: int
    item_reason: Optional[str] = None
    sku: Optional[str] = None
    product_name: Optional[str] = None
    category_name: Optional[str] = None
    size_name: Optional[str] = None
    colour_name: Optional[str] = None


class StockAdjustmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    adjustment_id: int
    adjustment_reference: str
    adjustment_date: datetime
    adjustment_type: AdjustmentType
    reason: str
    status: AdjustmentStatus
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    items: List[StockAdjustmentItemResponse] = Field(default_factory=list)
    net_quantity_difference: int = 0


class ReturnItemCreate(BaseModel):
    """
    Request schema for sales_return_items.
    Note: refund_subtotal is a MySQL GENERATED ALWAYS STORED column
    and must NOT be submitted manually (extra='forbid').
    """

    model_config = ConfigDict(extra="forbid")

    sale_item_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    refund_unit_price: Optional[float] = Field(default=None, ge=0)


class ReturnCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    sale_id: int = Field(gt=0)
    return_date: Optional[datetime] = None
    return_reason: str = Field(min_length=1, max_length=255)
    notes: Optional[str] = None
    items: List[ReturnItemCreate] = Field(min_length=1)

    @field_validator("notes", mode="before")
    @classmethod
    def normalize_notes(cls, value: Optional[str]) -> Optional[str]:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped if stripped else None
        return value


class ReturnItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    return_item_id: int
    return_id: int
    sale_item_id: int
    variant_id: Optional[int] = None
    quantity: int
    quantity_sold: Optional[int] = None
    refund_unit_price: float
    refund_subtotal: float
    sku: Optional[str] = None
    product_name: Optional[str] = None
    category_name: Optional[str] = None
    size_name: Optional[str] = None
    colour_name: Optional[str] = None


class ReturnResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    return_id: int
    sale_id: int
    invoice_number: Optional[str] = None
    customer_name: Optional[str] = None
    return_date: datetime
    return_reason: str
    total_refund_amount: float
    return_status: ReturnStatus
    notes: Optional[str] = None
    created_at: datetime
    items: List[ReturnItemResponse] = Field(default_factory=list)
    total_quantity_returned: int = 0


class EligibleReturnSaleItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sale_item_id: int
    sale_id: int
    variant_id: int
    sku: str
    product_name: str
    category_name: str = "Apparel / Retail"
    size_name: str = "—"
    colour_name: str = "—"
    quantity: int
    unit_price: float
    subtotal: float
    previously_returned_quantity: int = 0
    remaining_eligible_quantity: int = 0


class EligibleReturnSaleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sale_id: int
    sale_code: str
    customer_id: Optional[int] = None
    customer_name: str = "Retail Customer"
    invoice_number: str
    sale_date: datetime
    total_amount: float
    status: str
    sale_label: str = "Completed sale"
    items: List[EligibleReturnSaleItemResponse] = Field(default_factory=list)


class ProductVariantLookupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    variant_id: int
    sku: str
    product_name: str
    category_name: str = "Apparel / Retail"
    size_name: str = "—"
    colour_name: str = "—"
    current_quantity_on_hand: int = 0
    reorder_level: int = 10
