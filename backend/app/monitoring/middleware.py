# Owner: Member 09
"""FastAPI request latency middleware and SQLAlchemy query execution instrumentation."""

import time
from typing import Callable

from sqlalchemy import Engine, event
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.monitoring.metrics import MetricsCollector, metrics_collector


def extract_query_type(statement: str) -> str:
    """Extract top-level SQL command keyword (SELECT, INSERT, UPDATE, EXPLAIN, etc.)."""
    cleaned = (statement or "").strip()
    if not cleaned:
        return "UNKNOWN"
    first_token = cleaned.split(None, 1)[0].upper().rstrip(";")
    return first_token[:50] or "UNKNOWN"


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Measures HTTP endpoint latency, sets X-Response-Time-Ms, and updates Prometheus metrics."""

    def __init__(
        self,
        app,
        collector: MetricsCollector | None = None,
        slow_request_threshold_ms: float = 500.0,
    ) -> None:
        super().__init__(app)
        self.collector = collector or metrics_collector
        self.slow_request_threshold_ms = slow_request_threshold_ms

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        self.collector.increment_active_requests()
        started = time.perf_counter()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            duration_ms = (time.perf_counter() - started) * 1000.0
            response.headers["X-Response-Time-Ms"] = f"{duration_ms:.3f}"
            if duration_ms >= self.slow_request_threshold_ms:
                response.headers["X-Slow-Request"] = "true"
            return response
        finally:
            duration_ms = (time.perf_counter() - started) * 1000.0
            route = request.scope.get("route")
            route_path = getattr(route, "path", None) or request.url.path
            self.collector.record_http_request(
                method=request.method,
                path=route_path,
                status_code=status_code,
                duration_ms=duration_ms,
            )
            self.collector.decrement_active_requests()


def attach_sqlalchemy_query_timer(
    engine: Engine,
    collector: MetricsCollector | None = None,
) -> None:
    """Attach idempotent before/after cursor execution hooks to a SQLAlchemy Engine."""
    target_collector = collector or metrics_collector
    if getattr(engine, "_m09_timer_attached", False):
        return

    @event.listens_for(engine, "before_cursor_execute")
    def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        conn.info.setdefault("_m09_query_start", []).append(time.perf_counter())

    @event.listens_for(engine, "after_cursor_execute")
    def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        starts = conn.info.get("_m09_query_start")
        if not starts:
            return
        started = starts.pop(-1)
        duration_ms = (time.perf_counter() - started) * 1000.0
        qtype = extract_query_type(statement)
        target_collector.record_db_query(query_type=qtype, duration_ms=duration_ms)

    setattr(engine, "_m09_timer_attached", True)
