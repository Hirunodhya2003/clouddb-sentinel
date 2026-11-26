# Owner: Member 05
# Inventory management API endpoints.

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.inventory import (
    InventoryResponse,
    InventoryUpdate,
    StockAdjustmentCreate,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("/", response_model=list[InventoryResponse])
def get_inventory(db: Session = Depends(get_db)):
    return InventoryService.get_inventory(db)


@router.get("/low-stock", response_model=list[InventoryResponse])
def get_low_stock(db: Session = Depends(get_db)):
    return InventoryService.get_low_stock(db)

@router.get("/movements")
def get_inventory_movements(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return InventoryService.get_movements(db, limit)

@router.get("/{variant_id}", response_model=InventoryResponse)
def get_inventory_by_variant(
    variant_id: int,
    db: Session = Depends(get_db)
):
    try:
        return InventoryService.get_inventory_by_variant(db, variant_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.patch("/{variant_id}/reorder-level")
def update_reorder_level(
    variant_id: int,
    payload: InventoryUpdate,
    db: Session = Depends(get_db)
):
    try:
        return InventoryService.update_reorder_level(
            db, variant_id, payload.reorder_level
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.post("/adjustments", status_code=201)
def create_stock_adjustment(
    payload: StockAdjustmentCreate,
    db: Session = Depends(get_db)
):
    try:
        return InventoryService.create_stock_adjustment(
            db=db,
            variant_id=payload.variant_id,
            quantity_after=payload.quantity_after,
            adjustment_type=payload.adjustment_type,
            reason=payload.reason,
            item_reason=payload.item_reason
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
