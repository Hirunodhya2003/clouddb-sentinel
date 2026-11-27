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

    def fetch_business_summary(self) -> dict[str, Any]:
        objects = self._existing_objects()
        if "business_summary_view" in objects:
            row = self.db.execute(text("SELECT * FROM business_summary_view")).mappings().first()
            if row:
                data = {k: (float(v) if isinstance(v, Decimal) else v) for k, v in dict(row).items()}
                data["source"] = "business_summary_view"
                return data

        summary: dict[str, Any] = {
            "completed_sales_count": 0,
            "gross_sales_revenue": 0.0,
            "total_discounts_given": 0.0,
            "pending_sales_count": 0,
            "received_purchases_count": 0,
            "total_purchase_spend": 0.0,
            "pending_purchases_count": 0,
            "estimated_net_cashflow": 0.0,
            "active_products_count": 0,
            "active_variants_count": 0,
            "total_units_in_stock": 0,
            "inventory_cost_value": 0.0,
            "inventory_retail_value": 0.0,
            "low_stock_variants_count": 0,
            "out_of_stock_variants_count": 0,
            "active_customers_count": 0,
            "active_suppliers_count": 0,
            "source": "computed",
        }

        if "sales" in objects:
            r = self.db.execute(
                text(
                    """
                    SELECT
                        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_cnt,
                        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) AS rev,
                        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN discount_amount ELSE 0 END), 0) AS disc,
                        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_cnt
                    FROM sales
                    """
                )
            ).mappings().first()
            if r:
                summary["completed_sales_count"] = int(r["completed_cnt"] or 0)
                summary["gross_sales_revenue"] = round(float(r["rev"] or 0.0), 2)
                summary["total_discounts_given"] = round(float(r["disc"] or 0.0), 2)
                summary["pending_sales_count"] = int(r["pending_cnt"] or 0)

        if "purchases" in objects:
            r = self.db.execute(
                text(
                    """
                    SELECT
                        SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) AS rec_cnt,
                        COALESCE(SUM(CASE WHEN status = 'RECEIVED' THEN total_amount ELSE 0 END), 0) AS spend,
                        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_cnt
                    FROM purchases
                    """
                )
            ).mappings().first()
            if r:
                summary["received_purchases_count"] = int(r["rec_cnt"] or 0)
                summary["total_purchase_spend"] = round(float(r["spend"] or 0.0), 2)
                summary["pending_purchases_count"] = int(r["pending_cnt"] or 0)

        summary["estimated_net_cashflow"] = round(
            summary["gross_sales_revenue"] - summary["total_purchase_spend"], 2
        )

        if "products" in objects:
            cnt = self.db.execute(
                text("SELECT COUNT(*) FROM products WHERE LOWER(status) = 'active'")
            ).scalar()
            summary["active_products_count"] = int(cnt or 0)

        if "product_variants" in objects:
            cnt = self.db.execute(
                text("SELECT COUNT(*) FROM product_variants WHERE is_active = 1")
            ).scalar()
            summary["active_variants_count"] = int(cnt or 0)

        if "inventory" in objects:
            inv = self.db.execute(
                text(
                    """
                    SELECT
                        COALESCE(SUM(quantity_on_hand), 0) AS units,
                        SUM(CASE WHEN quantity_on_hand > 0 AND quantity_on_hand <= reorder_level THEN 1 ELSE 0 END) AS low_cnt,
                        SUM(CASE WHEN quantity_on_hand = 0 THEN 1 ELSE 0 END) AS out_cnt
                    FROM inventory
                    """
                )
            ).mappings().first()
            if inv:
                summary["total_units_in_stock"] = int(inv["units"] or 0)
                summary["low_stock_variants_count"] = int(inv["low_cnt"] or 0)
                summary["out_of_stock_variants_count"] = int(inv["out_cnt"] or 0)

            if "product_variants" in objects:
                val = self.db.execute(
                    text(
                        """
                        SELECT
                            COALESCE(SUM(i.quantity_on_hand * pv.cost_price), 0) AS cost_val,
                            COALESCE(SUM(i.quantity_on_hand * pv.selling_price), 0) AS retail_val
                        FROM inventory i
                        INNER JOIN product_variants pv ON pv.variant_id = i.variant_id
                        """
                    )
                ).mappings().first()
                if val:
                    summary["inventory_cost_value"] = round(float(val["cost_val"] or 0.0), 2)
                    summary["inventory_retail_value"] = round(float(val["retail_val"] or 0.0), 2)

        if "customers" in objects:
            cnt = self.db.execute(
                text("SELECT COUNT(*) FROM customers WHERE LOWER(status) = 'active'")
            ).scalar()
            summary["active_customers_count"] = int(cnt or 0)

        if "suppliers" in objects:
            cnt = self.db.execute(
                text("SELECT COUNT(*) FROM suppliers WHERE is_active = 1")
            ).scalar()
            summary["active_suppliers_count"] = int(cnt or 0)

        return summary

    # ------------------------------------------------------------------
    # Query Execution Plan (EXPLAIN / EXPLAIN ANALYZE)
    # ------------------------------------------------------------------
    def execute_explain(self, select_sql: str, analyze: bool = False) -> dict[str, Any]:
        dialect = self.dialect_name()
        started = time.perf_counter()
        analyze_tree: Optional[str] = None
        plan_rows: list[dict[str, Any]] = []

        if dialect == "mysql":
            explain_rows = self.db.execute(text(f"EXPLAIN {select_sql}")).mappings().all()
            for idx, r in enumerate(explain_rows, start=1):
                plan_rows.append(
                    {
                        "step_id": int(r.get("id") or idx),
                        "select_type": str(r.get("select_type") or "SIMPLE"),
                        "table_name": r.get("table"),
                        "access_type": str(r.get("type") or "ALL"),
                        "possible_keys": r.get("possible_keys"),
                        "key_used": r.get("key"),
                        "key_len": str(r.get("key_len")) if r.get("key_len") is not None else None,
                        "ref": r.get("ref"),
                        "rows_estimated": int(r.get("rows") or 0),
                        "filtered_pct": float(r.get("filtered") or 100.0),
                        "extra": r.get("Extra"),
                    }
                )
            if analyze:
                analyze_res = self.db.execute(text(f"EXPLAIN ANALYZE {select_sql}")).all()
                analyze_tree = "\n".join(str(row[0]) for row in analyze_res)
        else:
            # SQLite fallback for unit tests and local development
            eqp_rows = self.db.execute(text(f"EXPLAIN QUERY PLAN {select_sql}")).all()
            for idx, r in enumerate(eqp_rows, start=1):
                detail = str(r[-1])
                upper_detail = detail.upper()
                uses_idx = "USING INDEX" in upper_detail or "USING COVERING INDEX" in upper_detail
                key_name = None
                if "INDEX " in upper_detail:
                    after_idx = detail.split("INDEX ", 1)[-1].split()[0].strip("()")
                    key_name = after_idx
                access_type = "range" if uses_idx else ("ALL" if "SCAN" in upper_detail else "ref")
                table_name = None
                for token_prefix in ("SCAN ", "SEARCH "):
                    if token_prefix in upper_detail:
                        idx_pos = upper_detail.find(token_prefix) + len(token_prefix)
                        candidate = detail[idx_pos:].split()[0]
                        if candidate.upper() == "TABLE" and len(detail[idx_pos:].split()) > 1:
                            candidate = detail[idx_pos:].split()[1]
                        table_name = candidate
                        break
                plan_rows.append(
                    {
                        "step_id": idx,
                        "select_type": "SIMPLE",
                        "table_name": table_name,
                        "access_type": access_type,
                        "possible_keys": key_name,
                        "key_used": key_name,
                        "key_len": None,
                        "ref": None,
                        "rows_estimated": 10 if uses_idx else 100,
                        "filtered_pct": 100.0,
                        "extra": detail,
                    }
                )
            if analyze:
                t0 = time.perf_counter()
                actual_rows = self.db.execute(text(select_sql)).all()
                exec_ms = (time.perf_counter() - t0) * 1000.0
                analyze_tree = (
                    f"-> Executed query in {exec_ms:.3f} ms (actual rows={len(actual_rows)})\n"
                    + "\n".join(f"   {s['extra']}" for s in plan_rows)
                )

        duration_ms = round((time.perf_counter() - started) * 1000.0, 3)
        return {
            "dialect": dialect,
            "execution_time_ms": duration_ms,
            "steps": plan_rows,
            "analyze_tree": analyze_tree,
        }

    # ------------------------------------------------------------------
    # Query Performance Logs & MySQL Server Monitoring
    # ------------------------------------------------------------------
    def create_query_log(
        self,
        *,
        query_type: str,
        query_fingerprint: Optional[str],
        query_text: Optional[str],
        execution_time_ms: float,
        rows_examined: int = 0,
        rows_returned: int = 0,
        is_slow_query: bool = False,
        endpoint: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> Optional[QueryPerformanceLog]:
        objects = self._existing_objects()
        if "query_performance_logs" not in objects:
            return None

        entry = QueryPerformanceLog(
            user_id=user_id,
            query_type=query_type.strip().upper()[:50],
            query_fingerprint=query_fingerprint,
            query_text=query_text,
            execution_time_ms=Decimal(f"{max(0.0, float(execution_time_ms)):.3f}"),
            rows_examined=max(0, int(rows_examined)),
            rows_returned=max(0, int(rows_returned)),
            is_slow_query=bool(is_slow_query),
            endpoint=endpoint,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def list_query_logs(
        self,
        *,
        slow_only: bool = False,
        min_duration_ms: Optional[float] = None,
        query_type: Optional[str] = None,
        limit: int = 50,
    ) -> list[QueryPerformanceLog]:
        objects = self._existing_objects()
        if "query_performance_logs" not in objects:
            return []

        stmt = select(QueryPerformanceLog)
        if slow_only:
            stmt = stmt.where(QueryPerformanceLog.is_slow_query.is_(True))
        if min_duration_ms is not None:
            stmt = stmt.where(QueryPerformanceLog.execution_time_ms >= Decimal(f"{min_duration_ms:.3f}"))
        if query_type:
            stmt = stmt.where(QueryPerformanceLog.query_type == query_type.strip().upper())

        stmt = stmt.order_by(
            desc(QueryPerformanceLog.executed_at),
            desc(QueryPerformanceLog.log_id),
        ).limit(max(1, min(int(limit), 200)))
        return list(self.db.scalars(stmt).all())

    def count_query_logs(self) -> int:
        if "query_performance_logs" not in self._existing_objects():
            return 0
        val = self.db.scalar(select(func.count()).select_from(QueryPerformanceLog))
        return int(val or 0)

    def get_query_type_breakdown(self) -> list[dict[str, Any]]:
        if "query_performance_logs" not in self._existing_objects():
            return []

        rows = self.db.execute(
            text(
                """
                SELECT
                    query_type,
                    COUNT(*) AS total_executions,
                    SUM(CASE WHEN is_slow_query = 1 THEN 1 ELSE 0 END) AS slow_executions,
                    AVG(execution_time_ms) AS avg_execution_time_ms,
                    MAX(execution_time_ms) AS max_execution_time_ms,
                    COALESCE(SUM(rows_examined), 0) AS total_rows_examined
                FROM query_performance_logs
                GROUP BY query_type
                ORDER BY total_executions DESC
                """
            )
        ).mappings().all()
        return [
            {
                "query_type": str(r["query_type"]),
                "total_executions": int(r["total_executions"] or 0),
                "slow_executions": int(r["slow_executions"] or 0),
                "avg_execution_time_ms": round(float(r["avg_execution_time_ms"] or 0.0), 3),
                "max_execution_time_ms": round(float(r["max_execution_time_ms"] or 0.0), 3),
                "total_rows_examined": int(r["total_rows_examined"] or 0),
            }
            for r in rows
        ]

    def get_server_connection_stats(self) -> dict[str, Any]:
        dialect = self.dialect_name()
        if dialect == "mysql":
            version = str(self.db.execute(text("SELECT VERSION()")).scalar() or "8.0")
            status_rows = self.db.execute(
                text(
                    """
                    SHOW GLOBAL STATUS WHERE Variable_name IN (
                        'Threads_connected',
                        'Threads_running',
                        'Max_used_connections',
                        'Aborted_connects',
                        'Connections',
                        'Uptime',
                        'Questions',
                        'Slow_queries'
                    )
                    """
                )
            ).all()
            status_map = {str(k): str(v) for k, v in status_rows}

            var_rows = self.db.execute(
                text(
                    """
                    SHOW GLOBAL VARIABLES WHERE Variable_name IN (
                        'max_connections',
                        'slow_query_log',
                        'long_query_time'
                    )
                    """
                )
            ).all()
            var_map = {str(k): str(v) for k, v in var_rows}

            threads_connected = int(status_map.get("Threads_connected", 1))
            max_connections = max(1, int(var_map.get("max_connections", 151)))
            return {
                "mysql_version": version,
                "dialect": "mysql",
                "threads_connected": threads_connected,
                "threads_running": int(status_map.get("Threads_running", 1)),
                "max_used_connections": int(status_map.get("Max_used_connections", threads_connected)),
                "max_connections": max_connections,
                "connection_utilization_pct": round((threads_connected / max_connections) * 100.0, 2),
                "aborted_connects": int(status_map.get("Aborted_connects", 0)),
                "total_connections": int(status_map.get("Connections", 1)),
                "uptime_seconds": int(status_map.get("Uptime", 0)),
                "questions": int(status_map.get("Questions", 0)),
                "slow_queries_count": int(status_map.get("Slow_queries", 0)),
                "slow_query_log_enabled": var_map.get("slow_query_log", "OFF").upper() == "ON",
                "long_query_time_seconds": float(var_map.get("long_query_time", 10.0)),
            }

        sqlite_ver = str(self.db.execute(text("SELECT sqlite_version()")).scalar() or "3.x")
        slow_cnt = 0
        total_q = 0
        if "query_performance_logs" in self._existing_objects():
            total_q = self.count_query_logs()
            slow_cnt = int(
                self.db.execute(
                    text("SELECT COUNT(*) FROM query_performance_logs WHERE is_slow_query = 1")
                ).scalar()
                or 0
            )
        return {
            "mysql_version": f"SQLite {sqlite_ver} (Test Engine)",
            "dialect": dialect,
            "threads_connected": 1,
            "threads_running": 1,
            "max_used_connections": 1,
            "max_connections": 100,
            "connection_utilization_pct": 1.0,
            "aborted_connects": 0,
            "total_connections": 1,
            "uptime_seconds": 60,
            "questions": total_q,
            "slow_queries_count": slow_cnt,
            "slow_query_log_enabled": True,
            "long_query_time_seconds": 0.1,
        }

    def get_table_statistics(self) -> list[dict[str, Any]]:
        dialect = self.dialect_name()
        if dialect == "mysql":
            rows = self.db.execute(
                text(
                    """
                    SELECT
                        TABLE_NAME AS table_name,
                        COALESCE(ENGINE, 'InnoDB') AS engine,
                        COALESCE(TABLE_ROWS, 0) AS table_rows,
                        ROUND(COALESCE(DATA_LENGTH, 0) / 1024 / 1024, 3) AS data_size_mb,
                        ROUND(COALESCE(INDEX_LENGTH, 0) / 1024 / 1024, 3) AS index_size_mb,
                        ROUND(COALESCE(DATA_LENGTH + INDEX_LENGTH, 0) / 1024 / 1024, 3) AS total_size_mb,
                        ROUND(COALESCE(DATA_FREE, 0) / 1024 / 1024, 3) AS free_space_mb
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_TYPE = 'BASE TABLE'
                    ORDER BY (COALESCE(DATA_LENGTH, 0) + COALESCE(INDEX_LENGTH, 0)) DESC
                    """
                )
            ).mappings().all()
            return [
                {
                    "table_name": str(r["table_name"]),
                    "engine": str(r["engine"]),
                    "table_rows": int(r["table_rows"] or 0),
                    "data_size_mb": float(r["data_size_mb"] or 0.0),
                    "index_size_mb": float(r["index_size_mb"] or 0.0),
                    "total_size_mb": float(r["total_size_mb"] or 0.0),
                    "free_space_mb": float(r["free_space_mb"] or 0.0),
                }
                for r in rows
            ]

        inspector = inspect(self.db.get_bind())
        stats: list[dict[str, Any]] = []
        for tname in sorted(inspector.get_table_names()):
            quoted = tname.replace('"', '""')
            row_cnt = int(self.db.execute(text(f'SELECT COUNT(*) FROM "{quoted}"')).scalar() or 0)
            idx_cnt = len(inspector.get_indexes(tname))
            est_data_mb = round((row_cnt * 0.25) / 1024.0, 4)
            est_idx_mb = round((row_cnt * idx_cnt * 0.05) / 1024.0, 4)
            stats.append(
                {
                    "table_name": tname,
                    "engine": "SQLite",
                    "table_rows": row_cnt,
                    "data_size_mb": est_data_mb,
                    "index_size_mb": est_idx_mb,
                    "total_size_mb": round(est_data_mb + est_idx_mb, 4),
                    "free_space_mb": 0.0,
                }
            )
        stats.sort(key=lambda item: item["table_rows"], reverse=True)
        return stats
