# Owner: Member 09
"""Database repository for Business Reports, EXPLAIN plans, and MySQL Performance Monitoring."""

from datetime import datetime
from decimal import Decimal
import time
from typing import Any, Optional

from sqlalchemy import desc, func, inspect, select, text
from sqlalchemy.orm import Session

from app.models.query_performance_log import QueryPerformanceLog


class ReportRepository:
    """Encapsulates SQL queries for reports, EXPLAIN analysis, and server telemetry."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def dialect_name(self) -> str:
        return self.db.get_bind().dialect.name

    def _existing_objects(self) -> set[str]:
        bind = self.db.get_bind()
        inspector = inspect(bind)
        names = set(inspector.get_table_names())
        try:
            names.update(inspector.get_view_names())
        except Exception:
            pass
        return names

    @staticmethod
    def _parse_dt(val: Any) -> Optional[datetime]:
        if val is None:
            return None
        if isinstance(val, datetime):
            return val
        try:
            return datetime.fromisoformat(str(val).replace("Z", "+00:00"))
        except ValueError:
            return None

    # ------------------------------------------------------------------
    # Business Reports (Read-Only)
    # ------------------------------------------------------------------
    def fetch_sales_report(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        objects = self._existing_objects()
        if "sales" not in objects:
            return []

        has_customers = "customers" in objects
        has_items = "sale_items" in objects

        conditions = ["1 = 1"]
        params: dict[str, Any] = {"limit": max(1, min(int(limit), 500))}

        if start_date:
            conditions.append("DATE(s.sale_date) >= :start_date")
            params["start_date"] = start_date
        if end_date:
            conditions.append("DATE(s.sale_date) <= :end_date")
            params["end_date"] = end_date
        if status:
            conditions.append("UPPER(s.status) = :status")
            params["status"] = status.strip().upper()
        if search:
            params["search"] = f"%{search.strip()}%"
            if has_customers:
                conditions.append("(s.invoice_number LIKE :search OR COALESCE(c.name, '') LIKE :search)")
            else:
                conditions.append("s.invoice_number LIKE :search")

        where_sql = " AND ".join(conditions)
        customer_join = "LEFT JOIN customers c ON c.id = s.customer_id" if has_customers else ""
        customer_col = "COALESCE(c.name, 'Walk-in Customer')" if has_customers else "'Walk-in Customer'"
        items_join = "LEFT JOIN sale_items si ON si.sale_id = s.sale_id" if has_items else ""
        items_cnt = "COUNT(si.sale_item_id)" if has_items else "0"
        units_sum = "COALESCE(SUM(si.quantity), 0)" if has_items else "0"

        sql = f"""
            SELECT
                s.sale_id,
                s.invoice_number,
                s.sale_date,
                {customer_col} AS customer_name,
                s.status,
                {items_cnt} AS items_count,
                {units_sum} AS units_sold,
                s.subtotal,
                s.discount_amount,
                s.total_amount
            FROM sales s
            {customer_join}
            {items_join}
            WHERE {where_sql}
            GROUP BY
                s.sale_id,
                s.invoice_number,
                s.sale_date,
                customer_name,
                s.status,
                s.subtotal,
                s.discount_amount,
                s.total_amount
            ORDER BY s.sale_date DESC, s.sale_id DESC
            LIMIT :limit
        """
        rows = self.db.execute(text(sql), params).mappings().all()
        return [
            {
                "sale_id": int(r["sale_id"]),
                "invoice_number": str(r["invoice_number"]),
                "sale_date": self._parse_dt(r["sale_date"]),
                "customer_name": str(r["customer_name"]),
                "status": str(r["status"]),
                "items_count": int(r["items_count"] or 0),
                "units_sold": int(r["units_sold"] or 0),
                "subtotal": round(float(r["subtotal"] or 0.0), 2),
                "discount_amount": round(float(r["discount_amount"] or 0.0), 2),
                "total_amount": round(float(r["total_amount"] or 0.0), 2),
            }
            for r in rows
        ]

    def fetch_purchase_report(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        supplier_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        objects = self._existing_objects()
        if "purchases" not in objects:
            return []

        has_suppliers = "suppliers" in objects
        has_items = "purchase_items" in objects

        conditions = ["1 = 1"]
        params: dict[str, Any] = {"limit": max(1, min(int(limit), 500))}

        if start_date:
            conditions.append("DATE(pu.purchase_date) >= :start_date")
            params["start_date"] = start_date
        if end_date:
            conditions.append("DATE(pu.purchase_date) <= :end_date")
            params["end_date"] = end_date
        if status:
            conditions.append("UPPER(pu.status) = :status")
            params["status"] = status.strip().upper()
        if supplier_id is not None:
            conditions.append("pu.supplier_id = :supplier_id")
            params["supplier_id"] = int(supplier_id)
        if search:
            params["search"] = f"%{search.strip()}%"
            if has_suppliers:
                conditions.append(
                    "(COALESCE(pu.invoice_number, '') LIKE :search OR COALESCE(sup.supplier_name, '') LIKE :search)"
                )
            else:
                conditions.append("COALESCE(pu.invoice_number, '') LIKE :search")

        where_sql = " AND ".join(conditions)
        supplier_join = "LEFT JOIN suppliers sup ON sup.supplier_id = pu.supplier_id" if has_suppliers else ""
        supplier_col = "COALESCE(sup.supplier_name, 'Unknown Supplier')" if has_suppliers else "'Supplier'"
        items_join = "LEFT JOIN purchase_items pi ON pi.purchase_id = pu.purchase_id" if has_items else ""
        items_cnt = "COUNT(pi.purchase_item_id)" if has_items else "0"
        units_sum = "COALESCE(SUM(pi.quantity), 0)" if has_items else "0"

        sql = f"""
            SELECT
                pu.purchase_id,
                pu.invoice_number,
                pu.purchase_date,
                {supplier_col} AS supplier_name,
                pu.status,
                {items_cnt} AS items_count,
                {units_sum} AS units_purchased,
                pu.total_amount
            FROM purchases pu
            {supplier_join}
            {items_join}
            WHERE {where_sql}
            GROUP BY
                pu.purchase_id,
                pu.invoice_number,
                pu.purchase_date,
                supplier_name,
                pu.status,
                pu.total_amount
            ORDER BY pu.purchase_date DESC, pu.purchase_id DESC
            LIMIT :limit
        """
        rows = self.db.execute(text(sql), params).mappings().all()
        return [
            {
                "purchase_id": int(r["purchase_id"]),
                "invoice_number": str(r["invoice_number"] or f"PO-{r['purchase_id']}"),
                "purchase_date": self._parse_dt(r["purchase_date"]),
                "supplier_name": str(r["supplier_name"]),
                "status": str(r["status"]),
                "items_count": int(r["items_count"] or 0),
                "units_purchased": int(r["units_purchased"] or 0),
                "total_amount": round(float(r["total_amount"] or 0.0), 2),
            }
            for r in rows
        ]

    def fetch_inventory_report(
        self,
        category_id: Optional[int] = None,
        stock_status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 200,
    ) -> list[dict[str, Any]]:
        """Read-only inventory valuation query (never mutates inventory)."""
        objects = self._existing_objects()
        required = {"inventory", "product_variants", "products", "categories"}
        if not required.issubset(objects):
            return []

        has_sizes = "sizes" in objects
        has_colours = "colours" in objects

        conditions = ["1 = 1"]
        params: dict[str, Any] = {"limit": max(1, min(int(limit), 500))}

        if category_id is not None:
            conditions.append("c.category_id = :category_id")
            params["category_id"] = int(category_id)
        if stock_status:
            normalized = stock_status.strip().upper()
            if normalized == "OUT_OF_STOCK":
                conditions.append("i.quantity_on_hand = 0")
            elif normalized == "LOW_STOCK":
                conditions.append("i.quantity_on_hand > 0 AND i.quantity_on_hand <= i.reorder_level")
            elif normalized == "IN_STOCK":
                conditions.append("i.quantity_on_hand > i.reorder_level")
        if search:
            params["search"] = f"%{search.strip()}%"
            conditions.append(
                "(pv.sku LIKE :search OR p.product_name LIKE :search OR p.product_code LIKE :search)"
            )

        size_join = "LEFT JOIN sizes sz ON sz.size_id = pv.size_id" if has_sizes else ""
        size_col = "COALESCE(sz.size_name, '-')" if has_sizes else "'-'"
        colour_join = "LEFT JOIN colours cl ON cl.colour_id = pv.colour_id" if has_colours else ""
        colour_col = "COALESCE(cl.colour_name, '-')" if has_colours else "'-'"
        where_sql = " AND ".join(conditions)

        sql = f"""
            SELECT
                i.inventory_id,
                pv.variant_id,
                pv.sku,
                p.product_code,
                p.product_name,
                c.category_name,
                {size_col} AS size_name,
                {colour_col} AS colour_name,
                i.quantity_on_hand,
                i.reorder_level,
                pv.cost_price,
                pv.selling_price,
                (i.quantity_on_hand * pv.cost_price) AS stock_cost_value,
                (i.quantity_on_hand * pv.selling_price) AS stock_retail_value,
                CASE
                    WHEN i.quantity_on_hand = 0 THEN 'OUT_OF_STOCK'
                    WHEN i.quantity_on_hand <= i.reorder_level THEN 'LOW_STOCK'
                    ELSE 'IN_STOCK'
                END AS stock_status,
                i.last_stock_updated
            FROM inventory i
            INNER JOIN product_variants pv ON pv.variant_id = i.variant_id
            INNER JOIN products p ON p.product_id = pv.product_id
            INNER JOIN categories c ON c.category_id = p.category_id
            {size_join}
            {colour_join}
            WHERE {where_sql}
            ORDER BY i.quantity_on_hand ASC, pv.sku ASC
            LIMIT :limit
        """
        rows = self.db.execute(text(sql), params).mappings().all()
        return [
            {
                "inventory_id": int(r["inventory_id"]),
                "variant_id": int(r["variant_id"]),
                "sku": str(r["sku"]),
                "product_code": str(r["product_code"]),
                "product_name": str(r["product_name"]),
                "category_name": str(r["category_name"]),
                "size_name": str(r["size_name"]),
                "colour_name": str(r["colour_name"]),
                "quantity_on_hand": int(r["quantity_on_hand"] or 0),
                "reorder_level": int(r["reorder_level"] or 0),
                "cost_price": round(float(r["cost_price"] or 0.0), 2),
                "selling_price": round(float(r["selling_price"] or 0.0), 2),
                "stock_cost_value": round(float(r["stock_cost_value"] or 0.0), 2),
                "stock_retail_value": round(float(r["stock_retail_value"] or 0.0), 2),
                "stock_status": str(r["stock_status"]),
                "last_stock_updated": self._parse_dt(r["last_stock_updated"]),
            }
            for r in rows
        ]
