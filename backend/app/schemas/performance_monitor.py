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
