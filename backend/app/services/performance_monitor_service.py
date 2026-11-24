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
