# Owner: Member 09
"""Thread-safe application and database metrics collector with Prometheus exposition."""

import threading
import time
from collections import defaultdict
from typing import Any


class MetricsCollector:
    """Collects HTTP request and SQL query telemetry without external runtime dependencies."""

    LATENCY_BUCKETS_MS = (5.0, 10.0, 25.0, 50.0, 100.0, 250.0, 500.0, 1000.0, 2500.0)

    def __init__(self, slow_query_threshold_ms: float = 100.0) -> None:
        self._lock = threading.Lock()
        self.started_at = time.time()
        self.slow_query_threshold_ms = slow_query_threshold_ms

        self._active_requests = 0
        self._http_requests_total: dict[tuple[str, str, int], int] = defaultdict(int)
        self._http_duration_sum_ms: dict[tuple[str, str], float] = defaultdict(float)
        self._http_duration_count: dict[tuple[str, str], int] = defaultdict(int)
        self._http_duration_buckets: dict[tuple[str, str, float], int] = defaultdict(int)

        self._db_queries_total: dict[str, int] = defaultdict(int)
        self._db_slow_queries_total: dict[str, int] = defaultdict(int)
        self._db_query_duration_sum_ms: dict[str, float] = defaultdict(float)

    def increment_active_requests(self) -> None:
        with self._lock:
            self._active_requests += 1

    def decrement_active_requests(self) -> None:
        with self._lock:
            self._active_requests = max(0, self._active_requests - 1)

    def record_http_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
    ) -> None:
        normalized_method = (method or "GET").upper()
        normalized_path = path or "/"
        safe_duration = max(0.0, float(duration_ms))

        with self._lock:
            self._http_requests_total[(normalized_method, normalized_path, int(status_code))] += 1
            self._http_duration_sum_ms[(normalized_method, normalized_path)] += safe_duration
            self._http_duration_count[(normalized_method, normalized_path)] += 1
            for bound in self.LATENCY_BUCKETS_MS:
                if safe_duration <= bound:
                    self._http_duration_buckets[(normalized_method, normalized_path, bound)] += 1

    def record_db_query(
        self,
        query_type: str,
        duration_ms: float,
        is_slow: bool | None = None,
    ) -> None:
        qtype = (query_type or "OTHER").strip().upper()
        safe_duration = max(0.0, float(duration_ms))
        slow_flag = is_slow if is_slow is not None else (safe_duration >= self.slow_query_threshold_ms)

        with self._lock:
            self._db_queries_total[qtype] += 1
            self._db_query_duration_sum_ms[qtype] += safe_duration
            if slow_flag:
                self._db_slow_queries_total[qtype] += 1
