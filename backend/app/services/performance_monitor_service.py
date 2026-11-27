# Owner: Member 09
"""Service for MySQL connection monitoring, table storage statistics, and slow query telemetry."""

from typing import Optional

from app.monitoring.metrics import metrics_collector
from app.repositories.report_repository import ReportRepository
from app.schemas.performance_monitor import (
    ConnectionStatsSchema,
    PerformanceOverviewResponse,
    QueryTypeMetricItem,
    RecordQueryLogRequest,
    SlowQueryLogItem,
    TableStatisticItem,
)
from app.services.query_analyzer_service import compute_query_fingerprint


class PerformanceMonitorService:
    """Aggregates database connection health, table storage metrics, and slow query logs."""

    DEFAULT_SLOW_THRESHOLD_MS = 100.0

    def __init__(self, repository: ReportRepository) -> None:
        self.repository = repository

    def get_connection_stats(self) -> ConnectionStatsSchema:
        raw = self.repository.get_server_connection_stats()
        return ConnectionStatsSchema(**raw)

    def get_table_statistics(self) -> list[TableStatisticItem]:
        rows = self.repository.get_table_statistics()
        return [TableStatisticItem(**r) for r in rows]

    def get_slow_queries(
        self,
        *,
        slow_only: bool = False,
        min_duration_ms: Optional[float] = None,
        query_type: Optional[str] = None,
        limit: int = 50,
    ) -> list[SlowQueryLogItem]:
        logs = self.repository.list_query_logs(
            slow_only=slow_only,
            min_duration_ms=min_duration_ms,
            query_type=query_type,
            limit=limit,
        )
        return [SlowQueryLogItem.model_validate(item) for item in logs]

    def record_query_log(self, payload: RecordQueryLogRequest) -> SlowQueryLogItem:
        qtype = payload.query_type.strip().upper()
        if not qtype:
            raise ValueError("query_type must not be blank.")

        fingerprint = compute_query_fingerprint(payload.query_text) if payload.query_text else None
        is_slow = payload.execution_time_ms >= payload.slow_threshold_ms

        metrics_collector.record_db_query(
            query_type=qtype,
            duration_ms=payload.execution_time_ms,
            is_slow=is_slow,
        )

        entry = self.repository.create_query_log(
            query_type=qtype,
            query_fingerprint=fingerprint,
            query_text=payload.query_text,
            execution_time_ms=payload.execution_time_ms,
            rows_examined=payload.rows_examined,
            rows_returned=payload.rows_returned,
            is_slow_query=is_slow,
            endpoint=payload.endpoint,
            user_id=payload.user_id,
        )
        if entry is None:
            raise RuntimeError("query_performance_logs table is not initialized.")
        return SlowQueryLogItem.model_validate(entry)

    def get_overview(
        self,
        *,
        slow_only: bool = False,
        min_duration_ms: Optional[float] = None,
        limit: int = 50,
    ) -> PerformanceOverviewResponse:
        connections = self.get_connection_stats()
        tables = self.get_table_statistics()
        slow_queries = self.get_slow_queries(
            slow_only=slow_only,
            min_duration_ms=min_duration_ms,
            limit=limit,
        )
        breakdown = [
            QueryTypeMetricItem(**item)
            for item in self.repository.get_query_type_breakdown()
        ]
        total_logged = self.repository.count_query_logs()

        return PerformanceOverviewResponse(
            connections=connections,
            table_statistics=tables,
            slow_queries=slow_queries,
            query_type_breakdown=breakdown,
            total_logged_queries=total_logged,
            slow_query_threshold_ms=self.DEFAULT_SLOW_THRESHOLD_MS,
        )
