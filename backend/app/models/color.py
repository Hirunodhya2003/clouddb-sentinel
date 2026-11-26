# Owner: Member 03
# Model: Color

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


class Color(Base):
    __tablename__ = "colours"

    colour_id = Column(Integer, primary_key=True, autoincrement=True)

    colour_name = Column(String(50), nullable=False)

    colour_code = Column(String(7), nullable=True)

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
        UniqueConstraint("colour_name", name="uq_colours_name"),
        CheckConstraint(
            "CHAR_LENGTH(TRIM(colour_name)) > 0",
            name="chk_colour_name_not_empty"
        ),
        CheckConstraint(
            "colour_code IS NULL OR colour_code REGEXP '^#[0-9A-Fa-f]{6}$'",
            name="chk_colour_code_format"
        ),
    )