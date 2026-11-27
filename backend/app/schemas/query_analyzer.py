# Owner: Member 09
"""Pydantic schemas for Query Optimization & EXPLAIN / EXPLAIN ANALYZE APIs."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    sql: str = Field(..., min_length=6, max_length=10000, description="Read-only SELECT SQL query")
    analyze: bool = Field(default=False, description="Run EXPLAIN ANALYZE when supported")
    endpoint: Optional[str] = Field(default="/api/v1/query-analyzer/explain", max_length=255)


class PlanComparisonRequest(BaseModel):
    original_sql: str = Field(..., min_length=6, max_length=10000, description="Baseline SELECT query")
    optimized_sql: str = Field(..., min_length=6, max_length=10000, description="Candidate optimized SELECT query")
    analyze: bool = Field(default=False, description="Include EXPLAIN ANALYZE execution timing")


class ExplainPlanStep(BaseModel):
    step_id: int = 1
    select_type: str = "SIMPLE"
    table_name: Optional[str] = None
    access_type: str = "ALL"
    possible_keys: Optional[str] = None
    key_used: Optional[str] = None
    key_len: Optional[str] = None
    ref: Optional[str] = None
    rows_estimated: int = 0
    filtered_pct: float = 100.0
    extra: Optional[str] = None


class ExplainAnalysisResult(BaseModel):
    query_text: str
    query_fingerprint: str
    mode: Literal["EXPLAIN", "EXPLAIN_ANALYZE"]
    dialect: str = "mysql"
    execution_time_ms: float
    total_estimated_rows: int
    uses_index: bool
    uses_full_table_scan: bool
    uses_filesort: bool
    uses_temp_table: bool
    steps: list[ExplainPlanStep]
    analyze_tree: Optional[str] = None
    optimization_suggestions: list[str]
    severity: Literal["optimal", "warning", "critical"] = "optimal"


class PlanComparisonResponse(BaseModel):
    original: ExplainAnalysisResult
    optimized: ExplainAnalysisResult
    estimated_rows_delta: int
    estimated_rows_reduction_pct: float
    execution_time_delta_ms: float
    access_improved: bool
    winner: Literal["optimized", "original", "tie"]
    summary: str


class PresetQueryScenario(BaseModel):
    scenario_id: str
    title: str
    category: str
    description: str
    unoptimized_sql: str
    optimized_sql: str
