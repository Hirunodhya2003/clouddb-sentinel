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
