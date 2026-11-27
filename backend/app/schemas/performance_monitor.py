# Owner: Member 09
"""Pydantic schemas for MySQL & Application Performance Monitoring APIs."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ConnectionStatsSchema(BaseModel):
    mysql_version: str = "8.0"
    dialect: str = "mysql"
    threads_connected: int = 1
    threads_running: int = 1
    max_used_connections: int = 1
    max_connections: int = 151
    connection_utilization_pct: float = 0.66
    aborted_connects: int = 0
    total_connections: int = 1
    uptime_seconds: int = 0
    questions: int = 0
    slow_queries_count: int = 0
    slow_query_log_enabled: bool = False
    long_query_time_seconds: float = 10.0


class TableStatisticItem(BaseModel):
    table_name: str
    engine: str = "InnoDB"
    table_rows: int = 0
    data_size_mb: float = 0.0
    index_size_mb: float = 0.0
    total_size_mb: float = 0.0
    free_space_mb: float = 0.0


class QueryTypeMetricItem(BaseModel):
    query_type: str
    total_executions: int = 0
    slow_executions: int = 0
    avg_execution_time_ms: float = 0.0
    max_execution_time_ms: float = 0.0
    total_rows_examined: int = 0


class RecordQueryLogRequest(BaseModel):
    query_type: str = Field(..., min_length=1, max_length=50)
    query_text: Optional[str] = Field(default=None, max_length=10000)
    execution_time_ms: float = Field(..., ge=0.0)
    rows_examined: int = Field(default=0, ge=0)
    rows_returned: int = Field(default=0, ge=0)
    endpoint: Optional[str] = Field(default=None, max_length=255)
    user_id: Optional[int] = Field(default=None, gt=0)
    slow_threshold_ms: float = Field(default=100.0, ge=0.0)


class SlowQueryLogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    log_id: int
    user_id: Optional[int] = None
    query_type: str
    query_fingerprint: Optional[str] = None
    query_text: Optional[str] = None
    execution_time_ms: float
    rows_examined: int = 0
    rows_returned: int = 0
    is_slow_query: bool = False
    endpoint: Optional[str] = None
    executed_at: Optional[datetime] = None


class PerformanceOverviewResponse(BaseModel):
    connections: ConnectionStatsSchema
    table_statistics: list[TableStatisticItem]
    slow_queries: list[SlowQueryLogItem]
    query_type_breakdown: list[QueryTypeMetricItem]
    total_logged_queries: int = 0
    slow_query_threshold_ms: float = 100.0
