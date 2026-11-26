# Owner: Member 05
# Inventory business logic.

from datetime import datetime
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.repositories.inventory_repository import InventoryRepository


class InventoryService:

    @staticmethod
    def get_inventory(db: Session):
        return InventoryRepository.get_all(db)

    @staticmethod
    def get_inventory_by_variant(db: Session, variant_id: int):
        inventory = InventoryRepository.get_by_variant(db, variant_id)

        if not inventory:
            raise ValueError("Inventory record not found")

        return inventory

    @staticmethod
    def get_low_stock(db: Session):
        return InventoryRepository.get_low_stock(db)

    @staticmethod
    def update_reorder_level(
        db: Session,
        variant_id: int,
        reorder_level: int
    ):
        if reorder_level < 0:
            raise ValueError("Reorder level cannot be negative")

        inventory = InventoryRepository.get_by_variant(db, variant_id)

        if not inventory:
            raise ValueError("Inventory record not found")

        InventoryRepository.update_reorder_level(
            db, variant_id, reorder_level
        )

        return InventoryRepository.get_by_variant(db, variant_id)

    @staticmethod
    def create_stock_adjustment(
        db: Session,
        variant_id: int,
        quantity_after: int,
        adjustment_type: str,
        reason: str,
        created_by: int | None = None,
        item_reason: str | None = None
    ):
        if quantity_after < 0:
            raise ValueError("Quantity cannot be negative")

        if not reason.strip():
            raise ValueError("Adjustment reason is required")

        if adjustment_type not in {
            "PHYSICAL_COUNT", "DAMAGE", "LOSS", "CORRECTION", "OTHER"
        }:
            raise ValueError("Invalid adjustment type")

        try:
            # Lock the inventory row to prevent concurrent adjustments.
            inventory = db.execute(
                text("""
                    SELECT quantity_on_hand
                    FROM inventory
                    WHERE variant_id = :variant_id
                    FOR UPDATE
                """),
                {"variant_id": variant_id}
            ).mappings().first()

            if not inventory:
                raise ValueError("Inventory record not found")

            quantity_before = inventory["quantity_on_hand"]

            reference = (
                "ADJ-" + datetime.now().strftime("%Y%m%d%H%M%S")
                + "-" + uuid4().hex[:6].upper()
            )

            adjustment_id = db.execute(
                text("""
                    INSERT INTO stock_adjustments (
                        adjustment_reference,
                        adjustment_type,
                        reason,
                        status,
                        created_by
                    )
                    VALUES (
                        :reference,
                        :adjustment_type,
                        :reason,
                        'PENDING',
                        :created_by
                    )
                """),
                {
                    "reference": reference,
                    "adjustment_type": adjustment_type,
                    "reason": reason.strip(),
                    "created_by": created_by
                }
            ).lastrowid

            db.execute(
                text("""
                    INSERT INTO stock_adjustment_items (
                        adjustment_id,
                        variant_id,
                        quantity_before,
                        quantity_after,
                        item_reason
                    )
                    VALUES (
                        :adjustment_id,
                        :variant_id,
                        :quantity_before,
                        :quantity_after,
                        :item_reason
                    )
                """),
                {
                    "adjustment_id": adjustment_id,
                    "variant_id": variant_id,
                    "quantity_before": quantity_before,
                    "quantity_after": quantity_after,
                    "item_reason": item_reason
                }
            )

            db.commit()

            return {
                "adjustment_id": adjustment_id,
                "adjustment_reference": reference,
                "adjustment_type": adjustment_type,
                "status": "PENDING",
                "reason": reason.strip(),
                "variant_id": variant_id,
                "quantity_before": quantity_before,
                "quantity_after": quantity_after
            }

        except Exception:
            db.rollback()
            raise
    @staticmethod
    def get_movements(db: Session, limit: int = 100):
        return InventoryRepository.get_movements(db, limit)