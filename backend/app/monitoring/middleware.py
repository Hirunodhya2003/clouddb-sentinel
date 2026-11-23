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
