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
