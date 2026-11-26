# Owner: Member 03
# Model: Product Variant

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Numeric,
    TIMESTAMP,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    text
)
from sqlalchemy.schema import FetchedValue

from app.database.base import Base


class ProductVariant(Base):
    __tablename__ = "product_variants"

    variant_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    product_id = Column(
        Integer,
        ForeignKey(
            "products.product_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    size_id = Column(
        Integer,
        ForeignKey(
            "sizes.size_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    colour_id = Column(
        Integer,
        ForeignKey(
            "colours.colour_id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    sku = Column(
        String(50),
        nullable=False
    )

    cost_price = Column(
        Numeric(12, 2),
        nullable=False,
        server_default=text("0.00")
    )

    selling_price = Column(
        Numeric(12, 2),
        nullable=False
    )

    is_active = Column(
        Boolean,
        nullable=False,
        server_default=text("1")
    )

    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text(
            "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
        server_onupdate=FetchedValue()
    )

    __table_args__ = (
        UniqueConstraint(
            "sku",
            name="uq_variants_sku"
        ),
        UniqueConstraint(
            "product_id",
            "size_id",
            "colour_id",
            name="uq_product_size_colour"
        ),
        CheckConstraint(
            "CHAR_LENGTH(TRIM(sku)) > 0",
            name="chk_variant_sku_not_empty"
        ),
        CheckConstraint(
            "cost_price >= 0",
            name="chk_variant_cost_price"
        ),
        CheckConstraint(
            "selling_price >= 0",
            name="chk_variant_selling_price"
        ),
    )