# Owner: Member 05
# Inventory database operations.

from sqlalchemy import text
from sqlalchemy.orm import Session


class InventoryRepository:

    @staticmethod
    def get_all(db: Session):
        query = text("""
            SELECT
                inventory_id,
                variant_id,
                quantity_on_hand,
                reorder_level,
                last_stock_updated
            FROM inventory
            ORDER BY inventory_id DESC
        """)
        return [dict(row) for row in db.execute(query).mappings().all()]

    @staticmethod
    def get_by_variant(db: Session, variant_id: int):
        query = text("""
            SELECT inventory_id, variant_id, quantity_on_hand,
                   reorder_level, last_stock_updated
            FROM inventory
            WHERE variant_id = :variant_id
        """)
        row = db.execute(
            query, {"variant_id": variant_id}
        ).mappings().first()
        return dict(row) if row else None

    @staticmethod
    def get_low_stock(db: Session):
        query = text("""
            SELECT inventory_id, variant_id, quantity_on_hand,
                   reorder_level, last_stock_updated
            FROM inventory
            WHERE quantity_on_hand <= reorder_level
            ORDER BY quantity_on_hand ASC
        """)
        return [dict(row) for row in db.execute(query).mappings().all()]

    @staticmethod
    def update_reorder_level(
        db: Session, variant_id: int, reorder_level: int
    ):
        query = text("""
            UPDATE inventory
            SET reorder_level = :reorder_level
            WHERE variant_id = :variant_id
        """)
        result = db.execute(query, {
            "variant_id": variant_id,
            "reorder_level": reorder_level
        })
        db.commit()
        return result.rowcount > 0
    @staticmethod
    def get_movements(db: Session, limit: int = 100):
        query = text("""
            SELECT
                movement_id,
                variant_id,
                movement_type,
                quantity,
                reference_type,
                reference_id,
                movement_date,
                notes
            FROM stock_movements
            ORDER BY movement_date DESC
            LIMIT :limit
        """)

        rows = db.execute(
            query, {"limit": limit}
        ).mappings().all()

        return [dict(row) for row in rows]