# Owner: Member 03
# Model: Size

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    TIMESTAMP,
    UniqueConstraint,
    CheckConstraint,
    text
)

from app.database.base import Base


class Size(Base):
    __tablename__ = "sizes"

    size_id = Column(Integer, primary_key=True, autoincrement=True)

    size_name = Column(String(20), nullable=False)

    description = Column(String(100), nullable=True)

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

    __table_args__ = (
        UniqueConstraint("size_name", name="uq_sizes_name"),
        CheckConstraint(
            "CHAR_LENGTH(TRIM(size_name)) > 0",
            name="chk_size_name_not_empty"
        ),
    )