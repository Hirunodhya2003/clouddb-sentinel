# Owner: Member 09
"""SQLAlchemy ORM model for the query_performance_logs table."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, Index, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class QueryPerformanceLog(Base):
    """Application-level SQL query performance telemetry record."""

    __tablename__ = "query_performance_logs"

    log_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    query_type: Mapped[str] = mapped_column(String(50), nullable=False)
    query_fingerprint: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    query_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    execution_time_ms: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    rows_examined: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        nullable=False,
        default=0,
        server_default="0",
    )
    rows_returned: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        nullable=False,
        default=0,
        server_default="0",
    )
    is_slow_query: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="0",
    )
    endpoint: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    executed_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )

    __table_args__ = (
        CheckConstraint("execution_time_ms >= 0", name="chk_query_execution_time"),
        CheckConstraint("rows_examined >= 0", name="chk_query_rows_examined"),
        CheckConstraint("rows_returned >= 0", name="chk_query_rows_returned"),
        CheckConstraint("LENGTH(TRIM(query_type)) > 0", name="chk_query_type_not_empty"),
        Index("idx_query_performance_user", "user_id"),
        Index("idx_query_performance_type", "query_type"),
        Index("idx_query_performance_time", "executed_at"),
        Index("idx_query_performance_slow", "is_slow_query"),
        Index("idx_query_performance_duration", "execution_time_ms"),
    )
