# Owner: Member 09
"""Read-only database repository for executive Dashboard KPIs, charts, and recent activity."""

from datetime import datetime
from typing import Any

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session


class DashboardRepository:
    """Queries aggregated dashboard metrics safely across MySQL 8.0+ and SQLite test engines."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _existing_tables(self) -> set[str]:
        bind = self.db.get_bind()
        inspector = inspect(bind)
        names = set(inspector.get_table_names())
        try:
            names.update(inspector.get_view_names())
        except Exception:
            pass
        return names

    def get_kpi_totals(self) -> dict[str, Any]:
        tables = self._existing_tables()
        totals: dict[str, Any] = {
            "completed_sales_count": 0,
            "gross_sales_revenue": 0.0,
            "received_purchases_count": 0,
            "total_purchase_spend": 0.0,
            "active_products_count": 0,
            "total_units_in_stock": 0,
            "inventory_retail_value": 0.0,
            "low_stock_variants_count": 0,
            "active_customers_count": 0,
        }

        if "sales" in tables:
            row = self.db.execute(
                text(
                    """
                    SELECT
                        COUNT(*) AS cnt,
                        COALESCE(SUM(total_amount), 0) AS rev
                    FROM sales
                    WHERE status = 'COMPLETED'
                    """
                )
            ).mappings().first()
            if row:
                totals["completed_sales_count"] = int(row["cnt"] or 0)
                totals["gross_sales_revenue"] = float(row["rev"] or 0.0)

        if "purchases" in tables:
            row = self.db.execute(
                text(
                    """
                    SELECT
                        COUNT(*) AS cnt,
                        COALESCE(SUM(total_amount), 0) AS spend
                    FROM purchases
                    WHERE status = 'RECEIVED'
                    """
                )
            ).mappings().first()
            if row:
                totals["received_purchases_count"] = int(row["cnt"] or 0)
                totals["total_purchase_spend"] = float(row["spend"] or 0.0)

        if "products" in tables:
            row = self.db.execute(
                text("SELECT COUNT(*) AS cnt FROM products WHERE LOWER(status) = 'active'")
            ).mappings().first()
            if row:
                totals["active_products_count"] = int(row["cnt"] or 0)

        if "inventory" in tables:
            row = self.db.execute(
                text(
                    """
                    SELECT
                        COALESCE(SUM(quantity_on_hand), 0) AS units,
                        SUM(CASE WHEN quantity_on_hand <= reorder_level THEN 1 ELSE 0 END) AS low_cnt
                    FROM inventory
                    """
                )
            ).mappings().first()
            if row:
                totals["total_units_in_stock"] = int(row["units"] or 0)
                totals["low_stock_variants_count"] = int(row["low_cnt"] or 0)

            if "product_variants" in tables:
                val_row = self.db.execute(
                    text(
                        """
                        SELECT COALESCE(SUM(i.quantity_on_hand * pv.selling_price), 0) AS retail_val
                        FROM inventory i
                        INNER JOIN product_variants pv ON pv.variant_id = i.variant_id
                        """
                    )
                ).mappings().first()
                if val_row:
                    totals["inventory_retail_value"] = float(val_row["retail_val"] or 0.0)

        if "customers" in tables:
            row = self.db.execute(
                text("SELECT COUNT(*) AS cnt FROM customers WHERE LOWER(status) = 'active'")
            ).mappings().first()
            if row:
                totals["active_customers_count"] = int(row["cnt"] or 0)

        return totals

    def get_sales_trend(self, limit: int = 14) -> list[dict[str, Any]]:
        tables = self._existing_tables()
        if "sales" not in tables:
            return []

        rows = self.db.execute(
            text(
                """
                SELECT
                    DATE(sale_date) AS period_day,
                    COUNT(sale_id) AS orders_count,
                    COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) AS revenue,
                    COALESCE(SUM(discount_amount), 0) AS discounts
                FROM sales
                GROUP BY DATE(sale_date)
                ORDER BY period_day DESC
                LIMIT :limit
                """
            ),
            {"limit": max(1, min(int(limit), 90))},
        ).mappings().all()

        result: list[dict[str, Any]] = []
        for row in reversed(rows):
            period_str = str(row["period_day"] or "")
            result.append(
                {
                    "period": period_str,
                    "label": period_str[-5:] if len(period_str) >= 5 else period_str,
                    "orders_count": int(row["orders_count"] or 0),
                    "revenue": round(float(row["revenue"] or 0.0), 2),
                    "discounts": round(float(row["discounts"] or 0.0), 2),
                }
            )
        return result

    def get_inventory_by_category(self) -> list[dict[str, Any]]:
        tables = self._existing_tables()
        required = {"categories", "products", "product_variants", "inventory"}
        if not required.issubset(tables):
            return []

        rows = self.db.execute(
            text(
                """
                SELECT
                    c.category_id,
                    c.category_name,
                    COUNT(DISTINCT p.product_id) AS product_count,
                    COUNT(DISTINCT pv.variant_id) AS variant_count,
                    COALESCE(SUM(i.quantity_on_hand), 0) AS units_on_hand,
                    COALESCE(SUM(i.quantity_on_hand * pv.selling_price), 0) AS retail_value,
                    COALESCE(SUM(i.quantity_on_hand * pv.cost_price), 0) AS cost_value,
                    SUM(CASE WHEN i.quantity_on_hand <= i.reorder_level AND i.inventory_id IS NOT NULL THEN 1 ELSE 0 END) AS low_stock_count
                FROM categories c
                LEFT JOIN products p ON p.category_id = c.category_id
                LEFT JOIN product_variants pv ON pv.product_id = p.product_id
                LEFT JOIN inventory i ON i.variant_id = pv.variant_id
                GROUP BY c.category_id, c.category_name
                ORDER BY retail_value DESC, c.category_name ASC
                """
            )
        ).mappings().all()

        return [
            {
                "category_id": int(r["category_id"]) if r["category_id"] is not None else None,
                "category_name": str(r["category_name"]),
                "product_count": int(r["product_count"] or 0),
                "variant_count": int(r["variant_count"] or 0),
                "units_on_hand": int(r["units_on_hand"] or 0),
                "retail_value": round(float(r["retail_value"] or 0.0), 2),
                "cost_value": round(float(r["cost_value"] or 0.0), 2),
                "low_stock_count": int(r["low_stock_count"] or 0),
            }
            for r in rows
        ]

    @staticmethod
    def _parse_dt(val: Any) -> datetime | None:
        if val is None:
            return None
        if isinstance(val, datetime):
            return val
        try:
            return datetime.fromisoformat(str(val).replace("Z", "+00:00"))
        except ValueError:
            return None

    def get_recent_transactions(self, limit: int = 10) -> list[dict[str, Any]]:
        tables = self._existing_tables()
        safe_limit = max(1, min(int(limit), 50))
        events: list[dict[str, Any]] = []

        if "sales" in tables:
            has_customers = "customers" in tables
            sale_sql = (
                """
                SELECT
                    s.sale_id AS record_id,
                    s.invoice_number AS reference_number,
                    COALESCE(c.name, 'Walk-in Customer') AS counterparty,
                    s.total_amount AS amount,
                    s.status AS status,
                    s.sale_date AS occurred_at
                FROM sales s
                LEFT JOIN customers c ON c.id = s.customer_id
                ORDER BY s.sale_date DESC
                LIMIT :limit
                """
                if has_customers
                else """
                SELECT
                    s.sale_id AS record_id,
                    s.invoice_number AS reference_number,
                    'Walk-in Customer' AS counterparty,
                    s.total_amount AS amount,
                    s.status AS status,
                    s.sale_date AS occurred_at
                FROM sales s
                ORDER BY s.sale_date DESC
                LIMIT :limit
                """
            )
            for row in self.db.execute(text(sale_sql), {"limit": safe_limit}).mappings().all():
                events.append(
                    {
                        "transaction_type": "SALE",
                        "record_id": int(row["record_id"]),
                        "reference_number": str(row["reference_number"]),
                        "counterparty": str(row["counterparty"]),
                        "amount": round(float(row["amount"] or 0.0), 2),
                        "quantity": None,
                        "status": str(row["status"]),
                        "occurred_at": self._parse_dt(row["occurred_at"]),
                    }
                )

        if "purchases" in tables:
            has_suppliers = "suppliers" in tables
            purch_sql = (
                """
                SELECT
                    pu.purchase_id AS record_id,
                    COALESCE(pu.invoice_number, 'PO-' || CAST(pu.purchase_id AS CHAR)) AS reference_number,
                    COALESCE(sup.supplier_name, 'Supplier') AS counterparty,
                    pu.total_amount AS amount,
                    pu.status AS status,
                    pu.purchase_date AS occurred_at
                FROM purchases pu
                LEFT JOIN suppliers sup ON sup.supplier_id = pu.supplier_id
                ORDER BY pu.purchase_date DESC
                LIMIT :limit
                """
                if self.db.get_bind().dialect.name == "sqlite" and has_suppliers
                else """
                SELECT
                    pu.purchase_id AS record_id,
                    COALESCE(pu.invoice_number, CONCAT('PO-', pu.purchase_id)) AS reference_number,
                    COALESCE(sup.supplier_name, 'Supplier') AS counterparty,
                    pu.total_amount AS amount,
                    pu.status AS status,
                    pu.purchase_date AS occurred_at
                FROM purchases pu
                LEFT JOIN suppliers sup ON sup.supplier_id = pu.supplier_id
                ORDER BY pu.purchase_date DESC
                LIMIT :limit
                """
                if has_suppliers
                else """
                SELECT
                    pu.purchase_id AS record_id,
                    pu.invoice_number AS reference_number,
                    'Supplier' AS counterparty,
                    pu.total_amount AS amount,
                    pu.status AS status,
                    pu.purchase_date AS occurred_at
                FROM purchases pu
                ORDER BY pu.purchase_date DESC
                LIMIT :limit
                """
            )
            for row in self.db.execute(text(purch_sql), {"limit": safe_limit}).mappings().all():
                events.append(
                    {
                        "transaction_type": "PURCHASE",
                        "record_id": int(row["record_id"]),
                        "reference_number": str(row["reference_number"] or f"PO-{row['record_id']}"),
                        "counterparty": str(row["counterparty"]),
                        "amount": round(float(row["amount"] or 0.0), 2),
                        "quantity": None,
                        "status": str(row["status"]),
                        "occurred_at": self._parse_dt(row["occurred_at"]),
                    }
                )

        events.sort(
            key=lambda item: item["occurred_at"].timestamp() if item["occurred_at"] else 0.0,
            reverse=True,
        )
        return events[:safe_limit]
