# Owner: Member 09
"""Unit and API tests for Member 09 Performance Monitor, Metrics, Middleware, and Health Check."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.v1.endpoints import performance_monitor as pm_ep  # noqa: E402
from app.database.base import Base  # noqa: E402
import app.models.query_performance_log  # noqa: E402,F401
from app.monitoring import health_check  # noqa: E402
from app.monitoring.metrics import MetricsCollector, metrics_collector  # noqa: E402
from app.monitoring.middleware import (  # noqa: E402
    PerformanceMonitoringMiddleware,
    attach_sqlalchemy_query_timer,
)


@pytest.fixture
def monitor_client():
    metrics_collector.reset()
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    attach_sqlalchemy_query_timer(engine, collector=metrics_collector)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        with TestingSession() as db:
            yield db

    app = FastAPI()
    app.add_middleware(PerformanceMonitoringMiddleware, collector=metrics_collector)
    app.include_router(pm_ep.router, prefix="/api/v1")
    app.include_router(health_check.router)
    app.dependency_overrides[pm_ep.get_db] = override_get_db
    app.dependency_overrides[health_check.get_db] = override_get_db
    return TestClient(app)
