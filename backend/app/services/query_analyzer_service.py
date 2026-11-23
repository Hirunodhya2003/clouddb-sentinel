# Owner: Member 09
"""Service for SQL EXPLAIN, EXPLAIN ANALYZE, plan comparison, and optimization hints."""

import hashlib
import re
from typing import Optional

from app.repositories.report_repository import ReportRepository
from app.schemas.performance_monitor import SlowQueryLogItem
from app.schemas.query_analyzer import (
    ExplainAnalysisResult,
    ExplainPlanStep,
    PlanComparisonResponse,
    PresetQueryScenario,
)

_FORBIDDEN_SQL_PATTERN = re.compile(
    r"\b("
    r"INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|RENAME|"
    r"GRANT|REVOKE|CALL|EXEC|EXECUTE|SET|COMMIT|ROLLBACK|SAVEPOINT|"
    r"LOCK|UNLOCK|LOAD_FILE|OUTFILE|DUMPFILE|SLEEP|BENCHMARK"
    r")\b",
    re.IGNORECASE,
)


def compute_query_fingerprint(sql: str) -> str:
    """Normalize literals and whitespace to generate a deterministic 64-char SHA-256 digest."""
    normalized = re.sub(r"'[^']*'", "?", sql or "")
    normalized = re.sub(r"\b\d+(\.\d+)?\b", "?", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip().upper()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def sanitize_readonly_select(sql: str) -> str:
    """Ensure only a single read-only SELECT/WITH query can be passed to EXPLAIN."""
    cleaned = re.sub(r"--[^\n]*", " ", sql or "")
    cleaned = re.sub(r"/\*.*?\*/", " ", cleaned, flags=re.DOTALL).strip()
    if cleaned.endswith(";"):
        cleaned = cleaned[:-1].strip()

    if not cleaned:
        raise ValueError("SQL query must not be empty.")
    if ";" in cleaned:
        raise ValueError("Multiple SQL statements are not allowed.")

    upper = cleaned.upper()
    if not (upper.startswith("SELECT ") or upper.startswith("WITH ")):
        raise ValueError("Only read-only SELECT queries are permitted in Query Analyzer.")

    if _FORBIDDEN_SQL_PATTERN.search(cleaned):
        raise ValueError("Disallowed SQL keyword detected. Only read-only SELECT queries are allowed.")

    return cleaned


PRESET_SCENARIOS: list[PresetQueryScenario] = [
    PresetQueryScenario(
        scenario_id="sales-date-range",
        title="Sales Date Range Filter (Sargable vs Function-Wrapped)",
        category="Index Range Scan",
        description=(
            "Wrapping sale_date in YEAR(sale_date) prevents MySQL from using idx_sales_date. "
            "Rewriting with a half-open range enables an efficient B-Tree range scan."
        ),
        unoptimized_sql=(
            "SELECT * FROM sales "
            "WHERE status = 'COMPLETED' AND SUBSTR(CAST(sale_date AS CHAR), 1, 4) = '2026' "
            "ORDER BY sale_date DESC"
        ),
        optimized_sql=(
            "SELECT sale_id, invoice_number, sale_date, total_amount "
            "FROM sales "
            "WHERE sale_date >= '2026-01-01' AND sale_date < '2027-01-01' "
            "AND status = 'COMPLETED' "
            "ORDER BY sale_date DESC"
        ),
    ),
    PresetQueryScenario(
        scenario_id="invoice-lookup",
        title="Invoice Line-Item Lookup via Unique Index",
        category="Unique Index & Joins",
        description=(
            "Comparing wildcard LIKE '%INV-001%' against direct equality on uq_sales_invoice "
            "with selective column projection."
        ),
        unoptimized_sql=(
            "SELECT * FROM sales s "
            "INNER JOIN sale_items si ON si.sale_id = s.sale_id "
            "INNER JOIN product_variants pv ON pv.variant_id = si.variant_id "
            "INNER JOIN products p ON p.product_id = pv.product_id "
            "WHERE s.invoice_number LIKE '%INV-001%'"
        ),
        optimized_sql=(
            "SELECT s.invoice_number, s.sale_date, p.product_name, pv.sku, "
            "si.quantity, si.unit_price, si.subtotal "
            "FROM sales s "
            "INNER JOIN sale_items si ON si.sale_id = s.sale_id "
            "INNER JOIN product_variants pv ON pv.variant_id = si.variant_id "
            "INNER JOIN products p ON p.product_id = pv.product_id "
            "WHERE s.invoice_number = 'INV-001'"
        ),
    ),
    PresetQueryScenario(
        scenario_id="low-stock-scan",
        title="Low-Stock Inventory Projection Optimization",
        category="Inventory & Projection",
        description=(
            "Selecting only required SKU and stock columns instead of SELECT * reduces "
            "buffer memory and network transfer during low-stock checks."
        ),
        unoptimized_sql=(
            "SELECT * FROM inventory i "
            "INNER JOIN product_variants pv ON pv.variant_id = i.variant_id "
            "INNER JOIN products p ON p.product_id = pv.product_id "
            "WHERE i.quantity_on_hand - i.reorder_level <= 0"
        ),
        optimized_sql=(
            "SELECT pv.sku, p.product_name, i.quantity_on_hand, i.reorder_level "
            "FROM inventory i "
            "INNER JOIN product_variants pv ON pv.variant_id = i.variant_id "
            "INNER JOIN products p ON p.product_id = pv.product_id "
            "WHERE i.quantity_on_hand <= i.reorder_level "
            "ORDER BY i.quantity_on_hand ASC"
        ),
    ),
]


class QueryAnalyzerService:
    """Runs EXPLAIN / EXPLAIN ANALYZE, generates optimization recommendations, and logs telemetry."""

    SLOW_THRESHOLD_MS = 100.0

    def __init__(self, repository: ReportRepository) -> None:
        self.repository = repository

    @staticmethod
    def get_presets() -> list[PresetQueryScenario]:
        return PRESET_SCENARIOS
