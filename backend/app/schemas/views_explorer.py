
# Owner: Member 03
# Schemas: Views Explorer

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProductSummarySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_name: str
    brand: Optional[str] = None
    description: Optional[str] = None
    category_id: int
    category_name: str
    is_active: bool
    variant_count: int
    created_at: datetime
    updated_at: datetime


class VariantDetailsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    variant_id: int
    product_id: int
    product_name: str
    sku: str
    size_id: int
    size_name: str
    colour_id: int
    colour_name: str
    colour_code: Optional[str] = None
    cost_price: Decimal
    selling_price: Decimal
    profit_amount: Decimal
    profit_margin_percentage: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime
