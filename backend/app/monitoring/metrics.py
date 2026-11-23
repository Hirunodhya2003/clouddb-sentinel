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

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            total_requests = sum(self._http_requests_total.values())
            total_errors = sum(
                count for (_, _, code), count in self._http_requests_total.items() if code >= 500
            )
            total_duration = sum(self._http_duration_sum_ms.values())
            avg_latency_ms = round(total_duration / total_requests, 3) if total_requests else 0.0

            total_queries = sum(self._db_queries_total.values())
            total_slow_queries = sum(self._db_slow_queries_total.values())
            total_db_duration = sum(self._db_query_duration_sum_ms.values())
            avg_db_ms = round(total_db_duration / total_queries, 3) if total_queries else 0.0

            return {
                "uptime_seconds": round(time.time() - self.started_at, 2),
                "active_requests": self._active_requests,
                "http_requests_total": total_requests,
                "http_5xx_errors_total": total_errors,
                "http_avg_latency_ms": avg_latency_ms,
                "db_queries_total": total_queries,
                "db_slow_queries_total": total_slow_queries,
                "db_avg_query_ms": avg_db_ms,
                "queries_by_type": dict(self._db_queries_total),
            }

    def render_prometheus_text(self) -> str:
        """Render collected metrics in Prometheus text exposition format (0.0.4)."""
        lines: list[str] = []
        with self._lock:
            uptime = max(0.0, time.time() - self.started_at)
            lines.extend([
                "# HELP clouddb_process_uptime_seconds Application process uptime in seconds.",
                "# TYPE clouddb_process_uptime_seconds gauge",
                f"clouddb_process_uptime_seconds {uptime:.2f}",
                "# HELP clouddb_http_active_requests Number of in-flight HTTP requests.",
                "# TYPE clouddb_http_active_requests gauge",
                f"clouddb_http_active_requests {self._active_requests}",
                "# HELP clouddb_http_requests_total Total HTTP requests processed.",
                "# TYPE clouddb_http_requests_total counter",
            ])
            for (method, path, status_code), count in sorted(self._http_requests_total.items()):
                escaped_path = path.replace("\\", "\\\\").replace('"', '\\"')
                lines.append(
                    f'clouddb_http_requests_total{{method="{method}",path="{escaped_path}",status="{status_code}"}} {count}'
                )

            lines.extend([
                "# HELP clouddb_http_request_duration_ms HTTP request latency histogram in milliseconds.",
                "# TYPE clouddb_http_request_duration_ms histogram",
            ])
            for (method, path), total_count in sorted(self._http_duration_count.items()):
                escaped_path = path.replace("\\", "\\\\").replace('"', '\\"')
                for bound in self.LATENCY_BUCKETS_MS:
                    bucket_val = self._http_duration_buckets.get((method, path, bound), 0)
                    lines.append(
                        f'clouddb_http_request_duration_ms_bucket{{method="{method}",path="{escaped_path}",le="{bound}"}} {bucket_val}'
                    )
                lines.append(
                    f'clouddb_http_request_duration_ms_bucket{{method="{method}",path="{escaped_path}",le="+Inf"}} {total_count}'
                )
                sum_ms = self._http_duration_sum_ms.get((method, path), 0.0)
                lines.append(
                    f'clouddb_http_request_duration_ms_sum{{method="{method}",path="{escaped_path}"}} {sum_ms:.3f}'
                )
                lines.append(
                    f'clouddb_http_request_duration_ms_count{{method="{method}",path="{escaped_path}"}} {total_count}'
                )

            lines.extend([
                "# HELP clouddb_db_queries_total Total database queries instrumented.",
                "# TYPE clouddb_db_queries_total counter",
            ])
            for qtype, count in sorted(self._db_queries_total.items()):
                lines.append(f'clouddb_db_queries_total{{query_type="{qtype}"}} {count}')

            lines.extend([
                "# HELP clouddb_db_slow_queries_total Total slow database queries exceeding threshold.",
                "# TYPE clouddb_db_slow_queries_total counter",
            ])
            for qtype, count in sorted(self._db_slow_queries_total.items()):
                lines.append(f'clouddb_db_slow_queries_total{{query_type="{qtype}"}} {count}')

        lines.append("")
        return "\n".join(lines)

    def reset(self) -> None:
        with self._lock:
            self._active_requests = 0
            self._http_requests_total.clear()
            self._http_duration_sum_ms.clear()
            self._http_duration_count.clear()
            self._http_duration_buckets.clear()
            self._db_queries_total.clear()
            self._db_slow_queries_total.clear()
            self._db_query_duration_sum_ms.clear()


metrics_collector = MetricsCollector()
