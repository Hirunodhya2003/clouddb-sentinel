# Owner: Member 02
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category import Status


class ProductCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    product_code: str = Field(min_length=1, max_length=30)
    product_name: str = Field(min_length=1, max_length=150)
    category_id: int = Field(gt=0)
    description: Optional[str] = Field(default=None, max_length=500)
    base_price: Decimal = Field(default=Decimal("0"), ge=0, max_digits=10, decimal_places=2)
    status: Status = "active"


class ProductUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    product_code: Optional[str] = Field(default=None, min_length=1, max_length=30)
    product_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    category_id: Optional[int] = Field(default=None, gt=0)
    description: Optional[str] = Field(default=None, max_length=500)
    base_price: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    status: Optional[Status] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    product_code: str
    product_name: str
    category_id: int
    category_name: Optional[str] = None
    description: Optional[str] = None
    base_price: float
    status: Status
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ProductPage(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
