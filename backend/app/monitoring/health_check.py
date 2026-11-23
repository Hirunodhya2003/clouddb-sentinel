# Owner: Member 09
"""Application, database connectivity, and Prometheus metrics health check endpoints."""

import time
from datetime import datetime, timezone
from typing import Any, Generator

from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.monitoring.metrics import metrics_collector


def _resolve_get_db():
    try:
        from app.database.session import get_db as session_get_db

        return session_get_db
    except Exception:
        def _unavailable_db() -> Generator[Session, None, None]:
            yield None  # type: ignore[misc]

        return _unavailable_db


get_db = _resolve_get_db()

router = APIRouter(tags=["Monitoring & Health"])
