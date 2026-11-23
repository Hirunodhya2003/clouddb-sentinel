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

    @staticmethod
    def _build_suggestions(
        cleaned_sql: str,
        steps: list[ExplainPlanStep],
        uses_full_scan: bool,
        uses_filesort: bool,
        uses_temp: bool,
    ) -> list[str]:
        suggestions: list[str] = []
        upper_sql = cleaned_sql.upper()

        if re.search(r"\bSELECT\s+\*", upper_sql):
            suggestions.append(
                "Avoid SELECT *; project only required columns to reduce I/O and enable covering indexes."
            )
        if re.search(r"LIKE\s+'%[^']+%'", upper_sql):
            suggestions.append(
                "Leading wildcard LIKE '%term%' prevents B-Tree index usage; prefer prefix matching LIKE 'term%' or exact equality."
            )
        if uses_full_scan:
            scanned_tables = [s.table_name for s in steps if s.access_type.upper() == "ALL" and s.table_name]
            target = ", ".join(scanned_tables) if scanned_tables else "target table(s)"
            suggestions.append(
                f"Full table scan (type=ALL) detected on {target}. Ensure WHERE/JOIN columns use sargable predicates backed by an index."
            )
        if uses_filesort:
            suggestions.append(
                "Extra contains 'Using filesort'. Align ORDER BY columns with a composite index to avoid an extra sort pass."
            )
        if uses_temp:
            suggestions.append(
                "Extra contains 'Using temporary'. Optimize GROUP BY / DISTINCT columns to match index order."
            )
        if not suggestions:
            suggestions.append(
                "Execution plan looks well-optimized: selective index access is used with no full table scans or temporary sort tables."
            )
        return suggestions

    def analyze_query(
        self,
        sql: str,
        *,
        analyze: bool = False,
        endpoint: Optional[str] = "/api/v1/query-analyzer/explain",
        record_log: bool = True,
    ) -> ExplainAnalysisResult:
        cleaned_sql = sanitize_readonly_select(sql)
        fingerprint = compute_query_fingerprint(cleaned_sql)

        raw = self.repository.execute_explain(cleaned_sql, analyze=analyze)
        steps = [ExplainPlanStep(**s) for s in raw["steps"]]

        total_rows = sum(max(0, s.rows_estimated) for s in steps)
        uses_full_scan = any(s.access_type.upper() == "ALL" for s in steps)
        uses_index = any(
            bool(s.key_used) or s.access_type.upper() in {"CONST", "EQ_REF", "REF", "RANGE", "INDEX"}
            for s in steps
        )
        uses_filesort = any("FILESORT" in (s.extra or "").upper() for s in steps)
        uses_temp = any("TEMPORARY" in (s.extra or "").upper() for s in steps)

        suggestions = self._build_suggestions(
            cleaned_sql=cleaned_sql,
            steps=steps,
            uses_full_scan=uses_full_scan,
            uses_filesort=uses_filesort,
            uses_temp=uses_temp,
        )

        if uses_full_scan and (uses_filesort or uses_temp or re.search(r"\bSELECT\s+\*", cleaned_sql.upper())):
            severity = "critical"
        elif uses_full_scan or uses_filesort or uses_temp or re.search(r"\bSELECT\s+\*", cleaned_sql.upper()):
            severity = "warning"
        else:
            severity = "optimal"

        mode = "EXPLAIN_ANALYZE" if analyze else "EXPLAIN"
        exec_ms = float(raw["execution_time_ms"])

        if record_log:
            self.repository.create_query_log(
                query_type=mode,
                query_fingerprint=fingerprint,
                query_text=cleaned_sql,
                execution_time_ms=exec_ms,
                rows_examined=total_rows,
                rows_returned=len(steps),
                is_slow_query=exec_ms >= self.SLOW_THRESHOLD_MS,
                endpoint=endpoint,
            )

        return ExplainAnalysisResult(
            query_text=cleaned_sql,
            query_fingerprint=fingerprint,
            mode=mode,
            dialect=raw["dialect"],
            execution_time_ms=exec_ms,
            total_estimated_rows=total_rows,
            uses_index=uses_index,
            uses_full_table_scan=uses_full_scan,
            uses_filesort=uses_filesort,
            uses_temp_table=uses_temp,
            steps=steps,
            analyze_tree=raw["analyze_tree"],
            optimization_suggestions=suggestions,
            severity=severity,
        )

    def compare_plans(
        self,
        original_sql: str,
        optimized_sql: str,
        *,
        analyze: bool = False,
    ) -> PlanComparisonResponse:
        orig_res = self.analyze_query(
            original_sql,
            analyze=analyze,
            endpoint="/api/v1/query-analyzer/compare",
            record_log=True,
        )
        opt_res = self.analyze_query(
            optimized_sql,
            analyze=analyze,
            endpoint="/api/v1/query-analyzer/compare",
            record_log=True,
        )

        rows_delta = orig_res.total_estimated_rows - opt_res.total_estimated_rows
        if orig_res.total_estimated_rows > 0:
            reduction_pct = round((rows_delta / orig_res.total_estimated_rows) * 100.0, 2)
        else:
            reduction_pct = 0.0

        time_delta = round(orig_res.execution_time_ms - opt_res.execution_time_ms, 3)
        access_improved = (orig_res.uses_full_table_scan and not opt_res.uses_full_table_scan) or (
            not orig_res.uses_index and opt_res.uses_index
        )

        severity_rank = {"optimal": 0, "warning": 1, "critical": 2}
        orig_score = (
            severity_rank[orig_res.severity] * 1000
            + orig_res.total_estimated_rows
        )
        opt_score = (
            severity_rank[opt_res.severity] * 1000
            + opt_res.total_estimated_rows
        )

        if opt_score < orig_score:
            winner = "optimized"
            summary = (
                f"Optimized query improved the execution plan "
                f"(estimated rows examined reduced by {max(0.0, reduction_pct):.1f}%)."
            )
        elif opt_score > orig_score:
            winner = "original"
            summary = "Baseline query produced a lower-cost execution plan than the candidate query."
        else:
            winner = "tie"
            summary = "Both queries produced equivalent execution plan characteristics on the current dataset."

        return PlanComparisonResponse(
            original=orig_res,
            optimized=opt_res,
            estimated_rows_delta=rows_delta,
            estimated_rows_reduction_pct=reduction_pct,
            execution_time_delta_ms=time_delta,
            access_improved=access_improved,
            winner=winner,
            summary=summary,
        )

    def get_recent_history(self, limit: int = 20) -> list[SlowQueryLogItem]:
        logs = self.repository.list_query_logs(limit=limit)
        return [SlowQueryLogItem.model_validate(item) for item in logs]
