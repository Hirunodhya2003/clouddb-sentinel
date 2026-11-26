# Owner: Member 05
# Inventory request and response schemas.

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class InventoryBase(BaseModel):
    variant_id: int = Field(gt=0)
    quantity_on_hand: int = Field(ge=0)
    reorder_level: int = Field(default=5, ge=0)


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    reorder_level: int = Field(ge=0)


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    inventory_id: int
    variant_id: int
    quantity_on_hand: int
    reorder_level: int
    last_stock_updated: datetime


class StockAdjustmentCreate(BaseModel):
    variant_id: int = Field(gt=0)
    quantity_after: int = Field(ge=0)
    adjustment_type: str = Field(
        pattern="^(PHYSICAL_COUNT|DAMAGE|LOSS|CORRECTION|OTHER)$"
    )
    reason: str = Field(min_length=1, max_length=2000)
    item_reason: str | None = Field(default=None, max_length=255)


class StockAdjustmentResponse(BaseModel):
    adjustment_id: int
    adjustment_reference: str
    adjustment_type: str
    status: str
    reason: str


class LowStockResponse(BaseModel):
    inventory_id: int
    variant_id: int
    quantity_on_hand: int
    reorder_level: int
    last_stock_updated: datetime
