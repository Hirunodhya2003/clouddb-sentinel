
# Owner: Member 03
# Schemas: Product Variants

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

class VariantBase(BaseModel):


    product_id: int = Field(gt=0)
    size_id: int = Field(gt=0)
    colour_id: int = Field(gt=0)
    sku: str = Field(min_length=1, max_length=50)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    selling_price: Decimal = Field(ge=0)

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("SKU cannot be empty")

        return value




class VariantCreate(VariantBase):
    pass


class VariantUpdate(BaseModel):
    product_id: Optional[int] = Field(default=None, gt=0)
    size_id: Optional[int] = Field(default=None, gt=0)
    colour_id: Optional[int] = Field(default=None, gt=0)
    sku: Optional[str] = Field(default=None, min_length=1, max_length=50)
    cost_price: Optional[Decimal] = Field(default=None, ge=0)
    selling_price: Optional[Decimal] = Field(default=None, ge=0)
    is_active: Optional[bool] = None

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, value):
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("SKU cannot be empty")

        return value


class VariantResponse(VariantBase):
    model_config = ConfigDict(from_attributes=True)

    variant_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
