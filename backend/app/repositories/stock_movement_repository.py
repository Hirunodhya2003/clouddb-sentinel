# Owner: Member 08
"""
Database repository for Member 08:
  - stock_movements
  - stock_adjustments & stock_adjustment_items
  - sales_returns & sales_return_items
  - Read-only validation queries against sales, sale_items, inventory,
    product_variants, products, categories, sizes, colours, and users.

IMPORTANT ADBMS RULE (README.md Section 7.3):
  This repository NEVER executes UPDATE on inventory.quantity_on_hand.
  All newly created stock adjustments and sales returns are persisted in
  PENDING status. Inventory quantity mutations are reserved exclusively
  for Member 05's sp_update_inventory stored procedure.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


class StockMovementRepository:
    def __init__(self, db: Session):
        self.db = db

    def _existing_tables(self) -> set[str]:
        bind = self.db.get_bind()
        inspector = inspect(bind)
        return set(inspector.get_table_names())

    @staticmethod
    def _parse_dt(val: Any) -> datetime:
        if isinstance(val, datetime):
            return val
        if isinstance(val, str):
            cleaned = val.replace("Z", "+00:00")
            try:
                return datetime.fromisoformat(cleaned)
            except ValueError:
                return datetime.utcnow()
        return datetime.utcnow()

    def get_variant_metadata_map(self) -> Dict[int, Dict[str, Any]]:
        tables = self._existing_tables()
        if "product_variants" not in tables:
            return {}

        has_products = "products" in tables
        has_categories = "categories" in tables and has_products
        has_sizes = "sizes" in tables
        has_colours = "colours" in tables

        select_cols = ["pv.variant_id", "pv.sku"]
        joins = []

        if has_products:
            select_cols.append("p.product_name")
            joins.append("LEFT JOIN products p ON pv.product_id = p.product_id")
        else:
            select_cols.append("NULL AS product_name")

        if has_categories:
            select_cols.append("c.category_name")
            joins.append("LEFT JOIN categories c ON p.category_id = c.category_id")
        else:
            select_cols.append("NULL AS category_name")

        if has_sizes:
            select_cols.append("sz.size_name")
            joins.append("LEFT JOIN sizes sz ON pv.size_id = sz.size_id")
        else:
            select_cols.append("NULL AS size_name")

        if has_colours:
            select_cols.append("col.colour_name")
            joins.append("LEFT JOIN colours col ON pv.colour_id = col.colour_id")
        else:
            select_cols.append("NULL AS colour_name")

        sql = text(
            f"SELECT {', '.join(select_cols)} FROM product_variants pv {' '.join(joins)}"
        )
        rows = self.db.execute(sql).mappings().all()
        return {
            int(row["variant_id"]): {
                "variant_id": int(row["variant_id"]),
                "sku": row["sku"] or f"VAR-{row['variant_id']}",
                "product_name": row["product_name"]
                or f"Product Variant #{row['variant_id']}",
                "category_name": row["category_name"] or "Apparel / Retail",
                "size_name": row["size_name"] or "—",
                "colour_name": row["colour_name"] or "—",
            }
            for row in rows
        }

    def get_variant_inventory_quantity(self, variant_id: int) -> Optional[int]:
        tables = self._existing_tables()
        if "inventory" not in tables:
            return None

        row = (
            self.db.execute(
                text(
                    "SELECT quantity_on_hand FROM inventory WHERE variant_id = :variant_id"
                ),
                {"variant_id": variant_id},
            )
            .mappings()
            .first()
        )
        return int(row["quantity_on_hand"]) if row else None

    def variant_exists(self, variant_id: int) -> bool:
        tables = self._existing_tables()
        if "product_variants" not in tables:
            return True
        row = self.db.execute(
            text(
                "SELECT 1 FROM product_variants WHERE variant_id = :variant_id"
            ),
            {"variant_id": variant_id},
        ).first()
        return row is not None

    def user_exists(self, user_id: int) -> bool:
        tables = self._existing_tables()
        if "users" not in tables:
            return True
        row = self.db.execute(
            text("SELECT 1 FROM users WHERE user_id = :user_id"),
            {"user_id": int(user_id)},
        ).first()
        return row is not None

    def list_product_variants_for_adjustments(self) -> List[Dict[str, Any]]:
        """
        Read-only lookup of product_variants and their current inventory quantity_on_hand
        for the Member 08 Create Stock Adjustment Product Variant dropdown.
        """
        variant_map = self.get_variant_metadata_map()
        if not variant_map:
            return []

        tables = self._existing_tables()
        inventory_map: Dict[int, Dict[str, int]] = {}
        if "inventory" in tables:
            inv_rows = (
                self.db.execute(
                    text(
                        """
                        SELECT variant_id, quantity_on_hand, reorder_level
                        FROM inventory
                        """
                    )
                )
                .mappings()
                .all()
            )
            for ir in inv_rows:
                inventory_map[int(ir["variant_id"])] = {
                    "quantity_on_hand": int(ir["quantity_on_hand"] or 0),
                    "reorder_level": int(ir["reorder_level"] or 10),
                }

        results: List[Dict[str, Any]] = []
        for v_id in sorted(variant_map.keys()):
            v_meta = variant_map[v_id]
            inv_info = inventory_map.get(
                v_id, {"quantity_on_hand": 0, "reorder_level": 10}
            )
            results.append(
                {
                    "variant_id": v_id,
                    "sku": v_meta["sku"],
                    "product_name": v_meta["product_name"],
                    "category_name": v_meta["category_name"],
                    "size_name": v_meta["size_name"],
                    "colour_name": v_meta["colour_name"],
                    "current_quantity_on_hand": inv_info["quantity_on_hand"],
                    "reorder_level": inv_info["reorder_level"],
                }
            )
        return results

    # ------------------------------------------------------------------------
    # STOCK MOVEMENTS (Read-Only Queries)
    # ------------------------------------------------------------------------
    def list_stock_movements(
        self,
        search: Optional[str] = None,
        movement_type: Optional[str] = None,
        variant_id: Optional[int] = None,
        reference_type: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        variant_map = self.get_variant_metadata_map()
        rows = (
            self.db.execute(
                text(
                    """
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
                    ORDER BY movement_date DESC, movement_id DESC
                    """
                )
            )
            .mappings()
            .all()
        )

        results: List[Dict[str, Any]] = []
        q_lower = search.strip().lower() if search else None

        for r in rows:
            v_id = int(r["variant_id"])
            v_meta = variant_map.get(
                v_id,
                {
                    "sku": f"VAR-{v_id}",
                    "product_name": f"Product Variant #{v_id}",
                    "category_name": "Apparel / Retail",
                    "size_name": "—",
                    "colour_name": "—",
                },
            )
            dt = self._parse_dt(r["movement_date"])
            date_prefix = dt.strftime("%Y-%m-%d")

            if movement_type and r["movement_type"] != movement_type:
                continue
            if variant_id is not None and v_id != int(variant_id):
                continue
            if reference_type and (r["reference_type"] or "") != reference_type:
                continue
            if from_date and date_prefix < from_date:
                continue
            if to_date and date_prefix > to_date:
                continue

            item = {
                "movement_id": int(r["movement_id"]),
                "variant_id": v_id,
                "movement_type": r["movement_type"],
                "quantity": int(r["quantity"]),
                "reference_type": r["reference_type"],
                "reference_id": int(r["reference_id"])
                if r["reference_id"] is not None
                else None,
                "movement_date": dt,
                "notes": r["notes"],
                "sku": v_meta["sku"],
                "product_name": v_meta["product_name"],
                "category_name": v_meta["category_name"],
                "size_name": v_meta["size_name"],
                "colour_name": v_meta["colour_name"],
            }

            if q_lower:
                haystack = " ".join(
                    [
                        str(item["movement_id"]),
                        f"mov-{item['movement_id']}",
                        f"rec-{item['movement_id']}",
                        str(item["variant_id"]),
                        item["movement_type"] or "",
                        item["reference_type"] or "",
                        str(item["reference_id"] or ""),
                        item["notes"] or "",
                        item["sku"] or "",
                        item["product_name"] or "",
                        item["category_name"] or "",
                    ]
                ).lower()
                if q_lower not in haystack:
                    continue

            results.append(item)

        return results

    def get_stock_movement_by_id(
        self, movement_id: int
    ) -> Optional[Dict[str, Any]]:
        variant_map = self.get_variant_metadata_map()
        r = (
            self.db.execute(
                text(
                    """
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
                    WHERE movement_id = :movement_id
                    """
                ),
                {"movement_id": movement_id},
            )
            .mappings()
            .first()
        )
        if not r:
            return None

        v_id = int(r["variant_id"])
        v_meta = variant_map.get(
            v_id,
            {
                "sku": f"VAR-{v_id}",
                "product_name": f"Product Variant #{v_id}",
                "category_name": "Apparel / Retail",
                "size_name": "—",
                "colour_name": "—",
            },
        )
        return {
            "movement_id": int(r["movement_id"]),
            "variant_id": v_id,
            "movement_type": r["movement_type"],
            "quantity": int(r["quantity"]),
            "reference_type": r["reference_type"],
            "reference_id": int(r["reference_id"])
            if r["reference_id"] is not None
            else None,
            "movement_date": self._parse_dt(r["movement_date"]),
            "notes": r["notes"],
            "sku": v_meta["sku"],
            "product_name": v_meta["product_name"],
            "category_name": v_meta["category_name"],
            "size_name": v_meta["size_name"],
            "colour_name": v_meta["colour_name"],
        }

    # ------------------------------------------------------------------------
    # STOCK ADJUSTMENTS & ITEMS
    # ------------------------------------------------------------------------
    def _build_adjustment_dict(
        self,
        adj_row: Any,
        item_rows: List[Any],
        variant_map: Dict[int, Dict[str, Any]],
    ) -> Dict[str, Any]:
        items: List[Dict[str, Any]] = []
        net_diff = 0

        for ir in item_rows:
            v_id = int(ir["variant_id"])
            qty_before = int(ir["quantity_before"])
            qty_after = int(ir["quantity_after"])
            diff = qty_after - qty_before
            net_diff += diff
            v_meta = variant_map.get(
                v_id,
                {
                    "sku": f"VAR-{v_id}",
                    "product_name": f"Product Variant #{v_id}",
                    "category_name": "Stock / Distribution",
                    "size_name": "—",
                    "colour_name": "—",
                },
            )
            items.append(
                {
                    "adjustment_item_id": int(ir["adjustment_item_id"]),
                    "adjustment_id": int(ir["adjustment_id"]),
                    "variant_id": v_id,
                    "quantity_before": qty_before,
                    "quantity_after": qty_after,
                    "quantity_difference": diff,
                    "item_reason": ir["item_reason"],
                    "sku": v_meta["sku"],
                    "product_name": v_meta["product_name"],
                    "category_name": v_meta["category_name"],
                    "size_name": v_meta["size_name"],
                    "colour_name": v_meta["colour_name"],
                }
            )

        return {
            "adjustment_id": int(adj_row["adjustment_id"]),
            "adjustment_reference": adj_row["adjustment_reference"],
            "adjustment_date": self._parse_dt(adj_row["adjustment_date"]),
            "adjustment_type": adj_row["adjustment_type"],
            "reason": adj_row["reason"],
            "status": adj_row["status"],
            "created_by": int(adj_row["created_by"])
            if adj_row["created_by"] is not None
            else None,
            "approved_by": int(adj_row["approved_by"])
            if adj_row["approved_by"] is not None
            else None,
            "created_at": self._parse_dt(adj_row["created_at"]),
            "updated_at": self._parse_dt(adj_row["updated_at"]),
            "items": items,
            "net_quantity_difference": net_diff,
        }

    def list_stock_adjustments(
        self,
        search: Optional[str] = None,
        status: Optional[str] = None,
        adjustment_type: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        variant_map = self.get_variant_metadata_map()
        adj_rows = (
            self.db.execute(
                text(
                    """
                    SELECT
                        adjustment_id,
                        adjustment_reference,
                        adjustment_date,
                        adjustment_type,
                        reason,
                        status,
                        created_by,
                        approved_by,
                        created_at,
                        updated_at
                    FROM stock_adjustments
                    ORDER BY adjustment_date DESC, adjustment_id DESC
                    """
                )
            )
            .mappings()
            .all()
        )

        item_rows = (
            self.db.execute(
                text(
                    """
                    SELECT
                        adjustment_item_id,
                        adjustment_id,
                        variant_id,
                        quantity_before,
                        quantity_after,
                        item_reason
                    FROM stock_adjustment_items
                    ORDER BY adjustment_item_id ASC
                    """
                )
            )
            .mappings()
            .all()
        )

        items_by_adj: Dict[int, List[Any]] = {}
        for ir in item_rows:
            items_by_adj.setdefault(int(ir["adjustment_id"]), []).append(ir)

        results: List[Dict[str, Any]] = []
        q_lower = search.strip().lower() if search else None

        for ar in adj_rows:
            adj_dict = self._build_adjustment_dict(
                ar, items_by_adj.get(int(ar["adjustment_id"]), []), variant_map
            )
            date_prefix = adj_dict["adjustment_date"].strftime("%Y-%m-%d")

            if status and adj_dict["status"] != status:
                continue
            if adjustment_type and adj_dict["adjustment_type"] != adjustment_type:
                continue
            if from_date and date_prefix < from_date:
                continue
            if to_date and date_prefix > to_date:
                continue

            if q_lower:
                item_terms = " ".join(
                    f"{i['sku']} {i['product_name']} {i['item_reason'] or ''}"
                    for i in adj_dict["items"]
                )
                haystack = " ".join(
                    [
                        str(adj_dict["adjustment_id"]),
                        adj_dict["adjustment_reference"],
                        adj_dict["adjustment_type"],
                        adj_dict["status"],
                        adj_dict["reason"],
                        item_terms,
                    ]
                ).lower()
                if q_lower not in haystack:
                    continue

            results.append(adj_dict)

        return results

    def get_stock_adjustment_by_id(
        self, adjustment_id: int
    ) -> Optional[Dict[str, Any]]:
        variant_map = self.get_variant_metadata_map()
        ar = (
            self.db.execute(
                text(
                    """
                    SELECT
                        adjustment_id,
                        adjustment_reference,
                        adjustment_date,
                        adjustment_type,
                        reason,
                        status,
                        created_by,
                        approved_by,
                        created_at,
                        updated_at
                    FROM stock_adjustments
                    WHERE adjustment_id = :adjustment_id
                    """
                ),
                {"adjustment_id": adjustment_id},
            )
            .mappings()
            .first()
        )
        if not ar:
            return None

        item_rows = (
            self.db.execute(
                text(
                    """
                    SELECT
                        adjustment_item_id,
                        adjustment_id,
                        variant_id,
                        quantity_before,
                        quantity_after,
                        item_reason
                    FROM stock_adjustment_items
                    WHERE adjustment_id = :adjustment_id
                    ORDER BY adjustment_item_id ASC
                    """
                ),
                {"adjustment_id": adjustment_id},
            )
            .mappings()
            .all()
        )
        return self._build_adjustment_dict(ar, list(item_rows), variant_map)

    def get_stock_adjustment_by_reference(
        self, adjustment_reference: str
    ) -> Optional[Dict[str, Any]]:
        row = (
            self.db.execute(
                text(
                    """
                    SELECT adjustment_id
                    FROM stock_adjustments
                    WHERE LOWER(adjustment_reference) = LOWER(:ref)
                    """
                ),
                {"ref": adjustment_reference.strip()},
            )
            .mappings()
            .first()
        )
        if not row:
            return None
        return self.get_stock_adjustment_by_id(int(row["adjustment_id"]))

    def create_stock_adjustment(
        self,
        adjustment_reference: str,
        adjustment_type: str,
        reason: str,
        items: List[Dict[str, Any]],
        adjustment_date: Optional[datetime] = None,
        created_by: Optional[int] = None,
    ) -> Dict[str, Any]:
        now = datetime.utcnow()
        adj_date = adjustment_date or now

        try:
            result = self.db.execute(
                text(
                    """
                    INSERT INTO stock_adjustments (
                        adjustment_reference,
                        adjustment_date,
                        adjustment_type,
                        reason,
                        status,
                        created_by,
                        approved_by,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        :adjustment_reference,
                        :adjustment_date,
                        :adjustment_type,
                        :reason,
                        'PENDING',
                        :created_by,
                        NULL,
                        :created_at,
                        :updated_at
                    )
                    """
                ),
                {
                    "adjustment_reference": adjustment_reference.strip(),
                    "adjustment_date": adj_date,
                    "adjustment_type": adjustment_type,
                    "reason": reason.strip(),
                    "created_by": created_by,
                    "created_at": now,
                    "updated_at": now,
                },
            )
            adjustment_id = int(result.lastrowid)

            for item in items:
                self.db.execute(
                    text(
                        """
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
                        """
                    ),
                    {
                        "adjustment_id": adjustment_id,
                        "variant_id": int(item["variant_id"]),
                        "quantity_before": int(item["quantity_before"]),
                        "quantity_after": int(item["quantity_after"]),
                        "item_reason": item.get("item_reason"),
                    },
                )

            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise

        return self.get_stock_adjustment_by_id(adjustment_id)  # type: ignore[return-value]

    # ------------------------------------------------------------------------
    # SALES & SALE ITEMS VALIDATION + SALES RETURNS
    # ------------------------------------------------------------------------
    def get_sale_by_id(self, sale_id: int) -> Optional[Dict[str, Any]]:
        tables = self._existing_tables()
        if "sales" not in tables:
            return None

        has_customers = "customers" in tables
        if has_customers:
            row = (
                self.db.execute(
                    text(
                        """
                        SELECT
                            s.sale_id,
                            s.customer_id,
                            s.invoice_number,
                            s.sale_date,
                            s.total_amount,
                            s.status,
                            c.first_name,
                            c.last_name
                        FROM sales s
                        LEFT JOIN customers c ON s.customer_id = c.customer_id
                        WHERE s.sale_id = :sale_id
                        """
                    ),
                    {"sale_id": sale_id},
                )
                .mappings()
                .first()
            )
        else:
            row = (
                self.db.execute(
                    text(
                        """
                        SELECT
                            sale_id,
                            customer_id,
                            invoice_number,
                            sale_date,
                            total_amount,
                            status,
                            NULL AS first_name,
                            NULL AS last_name
                        FROM sales
                        WHERE sale_id = :sale_id
                        """
                    ),
                    {"sale_id": sale_id},
                )
                .mappings()
                .first()
            )

        if not row:
            return None

        full_name = " ".join(
            part for part in [row["first_name"], row["last_name"]] if part
        ).strip()

        return {
            "sale_id": int(row["sale_id"]),
            "customer_id": int(row["customer_id"])
            if row["customer_id"] is not None
            else None,
            "customer_name": full_name or "Retail Customer",
            "invoice_number": row["invoice_number"],
            "sale_date": self._parse_dt(row["sale_date"]),
            "total_amount": float(row["total_amount"]),
            "status": row["status"],
        }

    def get_sale_item(
        self, sale_id: int, sale_item_id: int
    ) -> Optional[Dict[str, Any]]:
        tables = self._existing_tables()
        if "sale_items" not in tables:
            return None

        row = (
            self.db.execute(
                text(
                    """
                    SELECT
                        sale_item_id,
                        sale_id,
                        variant_id,
                        quantity,
                        unit_price
                    FROM sale_items
                    WHERE sale_item_id = :sale_item_id
                      AND sale_id = :sale_id
                    """
                ),
                {"sale_item_id": sale_item_id, "sale_id": sale_id},
            )
            .mappings()
            .first()
        )
        if not row:
            return None

        return {
            "sale_item_id": int(row["sale_item_id"]),
            "sale_id": int(row["sale_id"]),
            "variant_id": int(row["variant_id"]),
            "quantity": int(row["quantity"]),
            "unit_price": float(row["unit_price"]),
        }

    def get_previously_returned_quantity(self, sale_item_id: int) -> int:
        row = (
            self.db.execute(
                text(
                    """
                    SELECT COALESCE(SUM(sri.quantity), 0) AS returned_qty
                    FROM sales_return_items sri
                    INNER JOIN sales_returns sr
                        ON sri.return_id = sr.return_id
                    WHERE sri.sale_item_id = :sale_item_id
                      AND sr.return_status <> 'REJECTED'
                    """
                ),
                {"sale_item_id": sale_item_id},
            )
            .mappings()
            .first()
        )
        return int(row["returned_qty"]) if row and row["returned_qty"] is not None else 0

    def list_completed_sales_for_returns(self) -> List[Dict[str, Any]]:
        """
        Read-only lookup of COMPLETED sales and their line items from MySQL
        for the Member 08 Create Sales Return dropdowns.
        Computes previously_returned_quantity and remaining_eligible_quantity
        for each sale line item.
        """
        tables = self._existing_tables()
        if "sales" not in tables or "sale_items" not in tables:
            return []

        variant_map = self.get_variant_metadata_map()
        has_customers = "customers" in tables

        if has_customers:
            sale_rows = (
                self.db.execute(
                    text(
                        """
                        SELECT
                            s.sale_id,
                            s.customer_id,
                            s.invoice_number,
                            s.sale_date,
                            s.total_amount,
                            s.status,
                            c.first_name,
                            c.last_name
                        FROM sales s
                        LEFT JOIN customers c ON s.customer_id = c.customer_id
                        WHERE s.status = 'COMPLETED'
                        ORDER BY s.sale_date DESC, s.sale_id DESC
                        """
                    )
                )
                .mappings()
                .all()
            )
        else:
            sale_rows = (
                self.db.execute(
                    text(
                        """
                        SELECT
                            sale_id,
                            customer_id,
                            invoice_number,
                            sale_date,
                            total_amount,
                            status,
                            NULL AS first_name,
                            NULL AS last_name
                        FROM sales
                        WHERE status = 'COMPLETED'
                        ORDER BY sale_date DESC, sale_id DESC
                        """
                    )
                )
                .mappings()
                .all()
            )

        if not sale_rows:
            return []

        item_rows = (
            self.db.execute(
                text(
                    """
                    SELECT
                        sale_item_id,
                        sale_id,
                        variant_id,
                        quantity,
                        unit_price
                    FROM sale_items
                    ORDER BY sale_item_id ASC
                    """
                )
            )
            .mappings()
            .all()
        )

        returned_by_item: Dict[int, int] = {}
        if "sales_returns" in tables and "sales_return_items" in tables:
            ret_rows = (
                self.db.execute(
                    text(
                        """
                        SELECT
                            sri.sale_item_id,
                            COALESCE(SUM(sri.quantity), 0) AS returned_qty
                        FROM sales_return_items sri
                        INNER JOIN sales_returns sr
                            ON sri.return_id = sr.return_id
                        WHERE sr.return_status <> 'REJECTED'
                        GROUP BY sri.sale_item_id
                        """
                    )
                )
                .mappings()
                .all()
            )
            for rr in ret_rows:
                returned_by_item[int(rr["sale_item_id"])] = int(
                    rr["returned_qty"] or 0
                )

        items_by_sale: Dict[int, List[Dict[str, Any]]] = {}
        for ir in item_rows:
            s_id = int(ir["sale_id"])
            si_id = int(ir["sale_item_id"])
            v_id = int(ir["variant_id"])
            qty_sold = int(ir["quantity"])
            unit_price = float(ir["unit_price"])
            prev_ret = returned_by_item.get(si_id, 0)
            rem_eligible = max(0, qty_sold - prev_ret)
            v_meta = variant_map.get(
                v_id,
                {
                    "sku": f"VAR-{v_id}",
                    "product_name": f"Product Variant #{v_id}",
                    "category_name": "Apparel / Retail",
                    "size_name": "—",
                    "colour_name": "—",
                },
            )
            items_by_sale.setdefault(s_id, []).append(
                {
                    "sale_item_id": si_id,
                    "sale_id": s_id,
                    "variant_id": v_id,
                    "sku": v_meta["sku"],
                    "product_name": v_meta["product_name"],
                    "category_name": v_meta["category_name"],
                    "size_name": v_meta["size_name"],
                    "colour_name": v_meta["colour_name"],
                    "quantity": qty_sold,
                    "unit_price": unit_price,
                    "subtotal": round(qty_sold * unit_price, 2),
                    "previously_returned_quantity": prev_ret,
                    "remaining_eligible_quantity": rem_eligible,
                }
            )

        results: List[Dict[str, Any]] = []
        for sr in sale_rows:
            s_id = int(sr["sale_id"])
            full_name = " ".join(
                part for part in [sr["first_name"], sr["last_name"]] if part
            ).strip()
            sale_items = items_by_sale.get(s_id, [])
            results.append(
                {
                    "sale_id": s_id,
                    "sale_code": f"SAL-{s_id}",
                    "customer_id": int(sr["customer_id"])
                    if sr["customer_id"] is not None
                    else None,
                    "customer_name": full_name or "Retail Customer",
                    "invoice_number": sr["invoice_number"],
                    "sale_date": self._parse_dt(sr["sale_date"]),
                    "total_amount": float(sr["total_amount"]),
                    "status": sr["status"],
                    "sale_label": "Multi-item order"
                    if len(sale_items) > 1
                    else "Retail purchase",
                    "items": sale_items,
                }
            )

        return results

    def list_sale_items_for_return(
        self, sale_id: int
    ) -> Optional[List[Dict[str, Any]]]:
        sale = self.get_sale_by_id(sale_id)
        if not sale:
            return None
        all_sales = self.list_completed_sales_for_returns()
        for s in all_sales:
            if s["sale_id"] == int(sale_id):
                return s["items"]
        return []

    def _build_return_dict(
        self,
        ret_row: Any,
        item_rows: List[Any],
        variant_map: Dict[int, Dict[str, Any]],
        sale_item_map: Dict[int, Dict[str, Any]],
        sale_map: Dict[int, Dict[str, Any]],
    ) -> Dict[str, Any]:
        items: List[Dict[str, Any]] = []
        total_qty = 0

        for ir in item_rows:
            si_id = int(ir["sale_item_id"])
            si_info = sale_item_map.get(si_id, {})
            v_id = si_info.get("variant_id")
            v_meta = (
                variant_map.get(v_id, {})
                if v_id is not None
                else {}
            )
            qty = int(ir["quantity"])
            unit_price = float(ir["refund_unit_price"])
            subtotal = round(qty * unit_price, 2)
            total_qty += qty

            items.append(
                {
                    "return_item_id": int(ir["return_item_id"]),
                    "return_id": int(ir["return_id"]),
                    "sale_item_id": si_id,
                    "variant_id": v_id,
                    "quantity": qty,
                    "quantity_sold": si_info.get("quantity"),
                    "refund_unit_price": unit_price,
                    "refund_subtotal": subtotal,
                    "sku": v_meta.get("sku", f"SI-{si_id}"),
                    "product_name": v_meta.get(
                        "product_name", f"Sale Item #{si_id}"
                    ),
                    "category_name": v_meta.get(
                        "category_name", "Apparel / Retail"
                    ),
                    "size_name": v_meta.get("size_name", "—"),
                    "colour_name": v_meta.get("colour_name", "—"),
                }
            )

        sale_id = int(ret_row["sale_id"])
        sale_info = sale_map.get(sale_id, {})

        return {
            "return_id": int(ret_row["return_id"]),
            "sale_id": sale_id,
            "invoice_number": sale_info.get(
                "invoice_number", f"INV-{sale_id}"
            ),
            "customer_name": sale_info.get(
                "customer_name", "Retail Customer"
            ),
            "return_date": self._parse_dt(ret_row["return_date"]),
            "return_reason": ret_row["return_reason"],
            "total_refund_amount": round(
                float(ret_row["total_refund_amount"]), 2
            ),
            "return_status": ret_row["return_status"],
            "notes": ret_row["notes"],
            "created_at": self._parse_dt(ret_row["created_at"]),
            "items": items,
            "total_quantity_returned": total_qty,
        }

    def _get_sales_and_items_maps(
        self,
    ) -> tuple[Dict[int, Dict[str, Any]], Dict[int, Dict[str, Any]]]:
        tables = self._existing_tables()
        sale_map: Dict[int, Dict[str, Any]] = {}
        sale_item_map: Dict[int, Dict[str, Any]] = {}

        if "sales" in tables:
            has_customers = "customers" in tables
            if has_customers:
                s_rows = (
                    self.db.execute(
                        text(
                            """
                            SELECT s.sale_id, s.invoice_number, c.first_name, c.last_name
                            FROM sales s
                            LEFT JOIN customers c ON s.customer_id = c.customer_id
                            """
                        )
                    )
                    .mappings()
                    .all()
                )
            else:
                s_rows = (
                    self.db.execute(
                        text(
                            """
                            SELECT sale_id, invoice_number, NULL AS first_name, NULL AS last_name
                            FROM sales
                            """
                        )
                    )
                    .mappings()
                    .all()
                )
            for sr in s_rows:
                full_name = " ".join(
                    p for p in [sr["first_name"], sr["last_name"]] if p
                ).strip()
                sale_map[int(sr["sale_id"])] = {
                    "invoice_number": sr["invoice_number"],
                    "customer_name": full_name or "Retail Customer",
                }

        if "sale_items" in tables:
            si_rows = (
                self.db.execute(
                    text(
                        """
                        SELECT sale_item_id, sale_id, variant_id, quantity, unit_price
                        FROM sale_items
                        """
                    )
                )
                .mappings()
                .all()
            )
            for sir in si_rows:
                sale_item_map[int(sir["sale_item_id"])] = {
                    "sale_item_id": int(sir["sale_item_id"]),
                    "sale_id": int(sir["sale_id"]),
                    "variant_id": int(sir["variant_id"]),
                    "quantity": int(sir["quantity"]),
                    "unit_price": float(sir["unit_price"]),
                }

        return sale_map, sale_item_map

    def list_sales_returns(
        self,
        search: Optional[str] = None,
        return_status: Optional[str] = None,
        sale_id: Optional[int] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        variant_map = self.get_variant_metadata_map()
        sale_map, sale_item_map = self._get_sales_and_items_maps()

        ret_rows = (
            self.db.execute(
                text(
                    """
                    SELECT
                        return_id,
                        sale_id,
                        return_date,
                        return_reason,
                        total_refund_amount,
                        return_status,
                        notes,
                        created_at
                    FROM sales_returns
                    ORDER BY return_date DESC, return_id DESC
                    """
                )
            )
            .mappings()
            .all()
        )

        item_rows = (
            self.db.execute(
                text(
                    """
                    SELECT
                        return_item_id,
                        return_id,
                        sale_item_id,
                        quantity,
                        refund_unit_price
                    FROM sales_return_items
                    ORDER BY return_item_id ASC
                    """
                )
            )
            .mappings()
            .all()
        )

        items_by_ret: Dict[int, List[Any]] = {}
        for ir in item_rows:
            items_by_ret.setdefault(int(ir["return_id"]), []).append(ir)

        results: List[Dict[str, Any]] = []
        q_lower = search.strip().lower() if search else None

        for rr in ret_rows:
            ret_dict = self._build_return_dict(
                rr,
                items_by_ret.get(int(rr["return_id"]), []),
                variant_map,
                sale_item_map,
                sale_map,
            )
            date_prefix = ret_dict["return_date"].strftime("%Y-%m-%d")

            if return_status and ret_dict["return_status"] != return_status:
                continue
            if sale_id is not None and ret_dict["sale_id"] != int(sale_id):
                continue
            if from_date and date_prefix < from_date:
                continue
            if to_date and date_prefix > to_date:
                continue

            if q_lower:
                item_terms = " ".join(
                    f"{i['sku']} {i['product_name']}" for i in ret_dict["items"]
                )
                haystack = " ".join(
                    [
                        str(ret_dict["return_id"]),
                        f"ret-{ret_dict['return_id']}",
                        str(ret_dict["sale_id"]),
                        f"sal-{ret_dict['sale_id']}",
                        ret_dict["invoice_number"] or "",
                        ret_dict["customer_name"] or "",
                        ret_dict["return_status"],
                        ret_dict["return_reason"],
                        ret_dict["notes"] or "",
                        item_terms,
                    ]
                ).lower()
                if q_lower not in haystack:
                    continue

            results.append(ret_dict)

        return results

    def get_sales_return_by_id(
        self, return_id: int
    ) -> Optional[Dict[str, Any]]:
        variant_map = self.get_variant_metadata_map()
        sale_map, sale_item_map = self._get_sales_and_items_maps()

        rr = (
            self.db.execute(
                text(
                    """
                    SELECT
                        return_id,
                        sale_id,
                        return_date,
                        return_reason,
                        total_refund_amount,
                        return_status,
                        notes,
                        created_at
                    FROM sales_returns
                    WHERE return_id = :return_id
                    """
                ),
                {"return_id": return_id},
            )
            .mappings()
            .first()
        )
        if not rr:
            return None

        item_rows = (
            self.db.execute(
                text(
                    """
                    SELECT
                        return_item_id,
                        return_id,
                        sale_item_id,
                        quantity,
                        refund_unit_price
                    FROM sales_return_items
                    WHERE return_id = :return_id
                    ORDER BY return_item_id ASC
                    """
                ),
                {"return_id": return_id},
            )
            .mappings()
            .all()
        )
        return self._build_return_dict(
            rr, list(item_rows), variant_map, sale_item_map, sale_map
        )

    def create_sales_return(
        self,
        sale_id: int,
        return_reason: str,
        total_refund_amount: Decimal,
        items: List[Dict[str, Any]],
        return_date: Optional[datetime] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = datetime.utcnow()
        ret_date = return_date or now

        result = self.db.execute(
            text(
                """
                INSERT INTO sales_returns (
                    sale_id,
                    return_date,
                    return_reason,
                    total_refund_amount,
                    return_status,
                    notes,
                    created_at
                )
                VALUES (
                    :sale_id,
                    :return_date,
                    :return_reason,
                    :total_refund_amount,
                    'PENDING',
                    :notes,
                    :created_at
                )
                """
            ),
            {
                "sale_id": sale_id,
                "return_date": ret_date,
                "return_reason": return_reason.strip(),
                "total_refund_amount": float(total_refund_amount),
                "notes": notes,
                "created_at": now,
            },
        )
        return_id = int(result.lastrowid)

        for item in items:
            self.db.execute(
                text(
                    """
                    INSERT INTO sales_return_items (
                        return_id,
                        sale_item_id,
                        quantity,
                        refund_unit_price
                    )
                    VALUES (
                        :return_id,
                        :sale_item_id,
                        :quantity,
                        :refund_unit_price
                    )
                    """
                ),
                {
                    "return_id": return_id,
                    "sale_item_id": int(item["sale_item_id"]),
                    "quantity": int(item["quantity"]),
                    "refund_unit_price": float(item["refund_unit_price"]),
                },
            )

        self.db.commit()
        return self.get_sales_return_by_id(return_id)  # type: ignore[return-value]
