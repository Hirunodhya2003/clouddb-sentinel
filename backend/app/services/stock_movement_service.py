# Owner: Member 08
"""
Business logic service for Member 08:
  - Stock Movements (read-only ledger queries)
  - Stock Adjustments (list, detail, create PENDING adjustment with item validation)
  - Sales Returns (list, detail, create PENDING return with sale/item quantity validation)

ADBMS INTEGRITY CONTRACT (README.md Section 7.3):
  - All new stock adjustments and sales returns are created in PENDING status.
  - This service NEVER directly updates `inventory.quantity_on_hand` or writes
    synthetic rows to `stock_movements`.
  - Inventory mutation and ledger movement creation upon COMPLETED transitions
    are delegated exclusively to Member 05's `sp_update_inventory` stored procedure.
"""

from decimal import Decimal
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.repositories.stock_movement_repository import StockMovementRepository
from app.schemas.stock_movement import (
    EligibleReturnSaleItemResponse,
    EligibleReturnSaleResponse,
    ProductVariantLookupResponse,
    ReturnCreate,
    ReturnResponse,
    StockAdjustmentCreate,
    StockAdjustmentResponse,
    StockMovementResponse,
)


class StockMovementService:
    def __init__(self, repo: StockMovementRepository):
        self.repo = repo

    # ------------------------------------------------------------------------
    # STOCK MOVEMENTS
    # ------------------------------------------------------------------------
    def list_stock_movements(
        self,
        search: Optional[str] = None,
        movement_type: Optional[str] = None,
        variant_id: Optional[int] = None,
        reference_type: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[StockMovementResponse]:
        rows = self.repo.list_stock_movements(
            search=search,
            movement_type=movement_type,
            variant_id=variant_id,
            reference_type=reference_type,
            from_date=from_date,
            to_date=to_date,
        )
        return [StockMovementResponse.model_validate(row) for row in rows]

    def get_stock_movement(self, movement_id: int) -> StockMovementResponse:
        row = self.repo.get_stock_movement_by_id(movement_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock movement {movement_id} not found.",
            )
        return StockMovementResponse.model_validate(row)

    # ------------------------------------------------------------------------
    # STOCK ADJUSTMENTS
    # ------------------------------------------------------------------------
    def list_product_variants_for_adjustments(
        self,
    ) -> List[ProductVariantLookupResponse]:
        rows = self.repo.list_product_variants_for_adjustments()
        return [
            ProductVariantLookupResponse.model_validate(row) for row in rows
        ]

    def list_stock_adjustments(
        self,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        adjustment_type: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[StockAdjustmentResponse]:
        rows = self.repo.list_stock_adjustments(
            search=search,
            status=status_filter,
            adjustment_type=adjustment_type,
            from_date=from_date,
            to_date=to_date,
        )
        return [StockAdjustmentResponse.model_validate(row) for row in rows]

    def get_stock_adjustment(
        self, adjustment_id: int
    ) -> StockAdjustmentResponse:
        row = self.repo.get_stock_adjustment_by_id(adjustment_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock adjustment {adjustment_id} not found.",
            )
        return StockAdjustmentResponse.model_validate(row)

    def create_stock_adjustment(
        self, payload: StockAdjustmentCreate
    ) -> StockAdjustmentResponse:
        existing = self.repo.get_stock_adjustment_by_reference(
            payload.adjustment_reference
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Stock adjustment reference '{payload.adjustment_reference}' "
                    "already exists."
                ),
            )

        if payload.created_by is not None and not self.repo.user_exists(
            payload.created_by
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Referenced created_by user_id {payload.created_by} does not exist."
                ),
            )

        seen_variants: set[int] = set()
        normalized_items = []

        for item in payload.items:
            if item.variant_id in seen_variants:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Duplicate variant_id {item.variant_id} in stock adjustment items "
                        "(violates uq_adjustment_variant)."
                    ),
                )
            seen_variants.add(item.variant_id)

            if not self.repo.variant_exists(item.variant_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product variant {item.variant_id} does not exist.",
                )

            if item.quantity_before is not None:
                qty_before = int(item.quantity_before)
            else:
                inv_qty = self.repo.get_variant_inventory_quantity(
                    item.variant_id
                )
                qty_before = int(inv_qty) if inv_qty is not None else 0

            normalized_items.append(
                {
                    "variant_id": int(item.variant_id),
                    "quantity_before": qty_before,
                    "quantity_after": int(item.quantity_after),
                    "item_reason": item.item_reason,
                }
            )

        try:
            created = self.repo.create_stock_adjustment(
                adjustment_reference=payload.adjustment_reference,
                adjustment_type=payload.adjustment_type,
                reason=payload.reason,
                items=normalized_items,
                adjustment_date=payload.adjustment_date,
                created_by=payload.created_by,
            )
        except IntegrityError as exc:
            self.repo.db.rollback()
            err_msg = str(getattr(exc, "orig", exc)).lower()
            if "uq_adjustment_reference" in err_msg or "duplicate" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Stock adjustment reference '{payload.adjustment_reference}' "
                        "already exists."
                    ),
                ) from None
            if "fk_adjustment_created_by" in err_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Referenced created_by user_id {payload.created_by} does not exist."
                    ),
                ) from None
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Database integrity constraint violated while saving stock adjustment. "
                    "Please verify adjustment reference, variant IDs, and user references."
                ),
            ) from None
        except SQLAlchemyError:
            self.repo.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to save stock adjustment due to a database validation error.",
            ) from None

        return StockAdjustmentResponse.model_validate(created)

    # ------------------------------------------------------------------------
    # SALES RETURNS
    # ------------------------------------------------------------------------
    def list_eligible_sales_for_returns(
        self,
    ) -> List[EligibleReturnSaleResponse]:
        rows = self.repo.list_completed_sales_for_returns()
        return [
            EligibleReturnSaleResponse.model_validate(row) for row in rows
        ]

    def list_eligible_sale_items_for_return(
        self, sale_id: int
    ) -> List[EligibleReturnSaleItemResponse]:
        sale = self.repo.get_sale_by_id(sale_id)
        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sale {sale_id} not found.",
            )
        if sale["status"] != "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Sale {sale_id} has status '{sale['status']}' and is not eligible for returns."
                ),
            )
        items = self.repo.list_sale_items_for_return(sale_id) or []
        return [
            EligibleReturnSaleItemResponse.model_validate(item)
            for item in items
        ]

    def list_sales_returns(
        self,
        search: Optional[str] = None,
        return_status: Optional[str] = None,
        sale_id: Optional[int] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[ReturnResponse]:
        rows = self.repo.list_sales_returns(
            search=search,
            return_status=return_status,
            sale_id=sale_id,
            from_date=from_date,
            to_date=to_date,
        )
        return [ReturnResponse.model_validate(row) for row in rows]

    def get_sales_return(self, return_id: int) -> ReturnResponse:
        row = self.repo.get_sales_return_by_id(return_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sales return {return_id} not found.",
            )
        return ReturnResponse.model_validate(row)

    def create_sales_return(self, payload: ReturnCreate) -> ReturnResponse:
        sale = self.repo.get_sale_by_id(payload.sale_id)
        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Sale {payload.sale_id} not found.",
            )

        if sale["status"] != "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Returns can only be created against COMPLETED sales "
                    f"(sale {payload.sale_id} status is '{sale['status']}')."
                ),
            )

        seen_sale_items: set[int] = set()
        normalized_items = []
        total_refund = Decimal("0.00")

        for item in payload.items:
            if item.sale_item_id in seen_sale_items:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Duplicate sale_item_id {item.sale_item_id} in return items."
                    ),
                )
            seen_sale_items.add(item.sale_item_id)

            sale_item = self.repo.get_sale_item(
                sale_id=payload.sale_id, sale_item_id=item.sale_item_id
            )
            if not sale_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Sale item {item.sale_item_id} does not belong to sale {payload.sale_id}."
                    ),
                )

            previously_returned = self.repo.get_previously_returned_quantity(
                item.sale_item_id
            )
            sold_qty = int(sale_item["quantity"])
            remaining_eligible = sold_qty - previously_returned

            if item.quantity > remaining_eligible:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Return quantity ({item.quantity}) exceeds remaining eligible "
                        f"returnable quantity ({remaining_eligible}) for sale_item_id "
                        f"{item.sale_item_id} (sold: {sold_qty}, already returned: {previously_returned})."
                    ),
                )

            unit_price = (
                Decimal(str(item.refund_unit_price))
                if item.refund_unit_price is not None
                else Decimal(str(sale_item["unit_price"]))
            )
            subtotal = (Decimal(str(item.quantity)) * unit_price).quantize(
                Decimal("0.01")
            )
            total_refund += subtotal

            normalized_items.append(
                {
                    "sale_item_id": int(item.sale_item_id),
                    "quantity": int(item.quantity),
                    "refund_unit_price": float(unit_price),
                }
            )

        created = self.repo.create_sales_return(
            sale_id=payload.sale_id,
            return_reason=payload.return_reason,
            total_refund_amount=total_refund,
            items=normalized_items,
            return_date=payload.return_date,
            notes=payload.notes,
        )
        return ReturnResponse.model_validate(created)
