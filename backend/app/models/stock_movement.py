# Owner: Member 08
"""
SQLAlchemy ORM models for Member 08:
  - StockMovement       (stock_movements)
  - StockAdjustment     (stock_adjustments)
  - StockAdjustmentItem (stock_adjustment_items)
  - SalesReturn         (sales_returns)
  - SalesReturnItem     (sales_return_items)

Conforms to the canonical MySQL 8.0 schema on origin/develop:
  - database/modules/stock_movements/01_create_stock_movements_table.sql
  - database/modules/inventory/03_create_stock_adjustments_table.sql
  - database/modules/inventory/04_create_stock_adjustment_items_table.sql
  - database/modules/sales/05_create_sales_returns_table.sql
  - database/modules/sales/06_create_sales_return_items_table.sql
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

import app.database.base as _base_module

if hasattr(_base_module, "Base"):
    Base = _base_module.Base
else:
    class Base(DeclarativeBase):
        pass

    _base_module.Base = Base


class StockMovement(Base):
    __tablename__ = "stock_movements"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_stock_movement_quantity"),
    )

    movement_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    variant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    movement_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    movement_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
        index=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"
    __table_args__ = (
        UniqueConstraint("adjustment_reference", name="uq_adjustment_reference"),
    )

    adjustment_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    adjustment_reference: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True
    )
    adjustment_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
        index=True,
    )
    adjustment_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    approved_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
        onupdate=datetime.utcnow,
    )

    items: Mapped[List["StockAdjustmentItem"]] = relationship(
        "StockAdjustmentItem",
        back_populates="adjustment",
        cascade="all, delete-orphan",
    )


class StockAdjustmentItem(Base):
    __tablename__ = "stock_adjustment_items"
    __table_args__ = (
        UniqueConstraint("adjustment_id", "variant_id", name="uq_adjustment_variant"),
        CheckConstraint("quantity_before >= 0", name="chk_adjustment_quantity_before"),
        CheckConstraint("quantity_after >= 0", name="chk_adjustment_quantity_after"),
    )

    adjustment_item_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    adjustment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("stock_adjustments.adjustment_id", ondelete="CASCADE"),
        nullable=False,
    )
    variant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    quantity_before: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_after: Mapped[int] = mapped_column(Integer, nullable=False)
    item_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    adjustment: Mapped["StockAdjustment"] = relationship(
        "StockAdjustment", back_populates="items"
    )

    @property
    def quantity_difference(self) -> int:
        return int(self.quantity_after) - int(self.quantity_before)


class SalesReturn(Base):
    __tablename__ = "sales_returns"
    __table_args__ = (
        CheckConstraint("total_refund_amount >= 0", name="chk_return_refund_amount"),
    )

    return_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    sale_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    return_date: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
        index=True,
    )
    return_reason: Mapped[str] = mapped_column(String(255), nullable=False)
    total_refund_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00")
    )
    return_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
        server_default="PENDING",
        index=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, server_default=func.now()
    )

    items: Mapped[List["SalesReturnItem"]] = relationship(
        "SalesReturnItem",
        back_populates="sales_return",
        cascade="all, delete-orphan",
    )


class SalesReturnItem(Base):
    __tablename__ = "sales_return_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_return_item_quantity"),
        CheckConstraint("refund_unit_price >= 0", name="chk_return_item_refund_price"),
    )

    return_item_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    return_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sales_returns.return_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sale_item_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    refund_unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sales_return: Mapped["SalesReturn"] = relationship(
        "SalesReturn", back_populates="items"
    )

    @property
    def refund_subtotal(self) -> float:
        return round(float(self.quantity) * float(self.refund_unit_price), 2)
