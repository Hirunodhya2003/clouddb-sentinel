# Owner: Member 05
# Database index management business logic.

import re

from sqlalchemy import text
from sqlalchemy.orm import Session


class IndexManagerService:

    ALLOWED_TABLES = {
        "inventory",
        "stock_movements",
        "stock_adjustments",
        "stock_adjustment_items",
        "product_variants",
    }

    INDEX_NAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_]{0,63}$")

    @classmethod
    def get_indexes(cls, db: Session):
        indexes = []

        for table_name in sorted(cls.ALLOWED_TABLES):
            rows = db.execute(
                text("""
                    SELECT
                        TABLE_NAME AS table_name,
                        INDEX_NAME AS index_name,
                        COLUMN_NAME AS column_name,
                        NON_UNIQUE AS non_unique,
                        SEQ_IN_INDEX AS sequence
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = :table_name
                    ORDER BY INDEX_NAME, SEQ_IN_INDEX
                """),
                {"table_name": table_name}
            ).mappings().all()

            indexes.extend(dict(row) for row in rows)

        return indexes

    @classmethod
    def create_index(
        cls,
        db: Session,
        table_name: str,
        index_name: str,
        columns: list[str],
        is_unique: bool = False,
    ):
        if table_name not in cls.ALLOWED_TABLES:
            raise ValueError("Table is not permitted for index management")

        if not cls.INDEX_NAME_PATTERN.fullmatch(index_name):
            raise ValueError("Invalid index name")

        if not columns or len(columns) != len(set(columns)):
            raise ValueError("Provide one or more distinct columns")

        existing_table = db.execute(
            text("""
                SELECT TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = :table_name
            """),
            {"table_name": table_name}
        ).first()

        if not existing_table:
            raise ValueError("Table does not exist in the current database")

        valid_columns = {
            row["COLUMN_NAME"]
            for row in db.execute(
                text("""
                    SELECT COLUMN_NAME
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = :table_name
                """),
                {"table_name": table_name}
            ).mappings().all()
        }

        if any(column not in valid_columns for column in columns):
            raise ValueError("One or more columns do not exist in the selected table")

        existing_index = db.execute(
            text("""
                SELECT INDEX_NAME
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = :table_name
                  AND INDEX_NAME = :index_name
                LIMIT 1
            """),
            {
                "table_name": table_name,
                "index_name": index_name
            }
        ).first()

        if existing_index:
            raise ValueError("An index with this name already exists")

        quoted_table = f"`{table_name}`"
        quoted_index = f"`{index_name}`"
        quoted_columns = ", ".join(f"`{column}`" for column in columns)
        unique_keyword = "UNIQUE " if is_unique else ""

        statement = (
            f"CREATE {unique_keyword}INDEX {quoted_index} "
            f"ON {quoted_table} ({quoted_columns})"
        )

        try:
            db.execute(text(statement))
            db.commit()
        except Exception:
            db.rollback()
            raise

        return {
            "table_name": table_name,
            "index_name": index_name,
            "columns": columns,
            "is_unique": is_unique,
            "message": "Index created successfully"
        }

    @classmethod
    def delete_index(
        cls,
        db: Session,
        table_name: str,
        index_name: str
    ):
        if table_name not in cls.ALLOWED_TABLES:
            raise ValueError("Table is not permitted for index management")

        if not cls.INDEX_NAME_PATTERN.fullmatch(index_name):
            raise ValueError("Invalid index name")

        index = db.execute(
            text("""
                SELECT INDEX_NAME
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = :table_name
                  AND INDEX_NAME = :index_name
                LIMIT 1
            """),
            {
                "table_name": table_name,
                "index_name": index_name
            }
        ).first()

        if not index:
            raise ValueError("Index not found")

        if index_name == "PRIMARY":
            raise ValueError("The primary key index cannot be deleted")

        statement = (
            f"ALTER TABLE `{table_name}` "
            f"DROP INDEX `{index_name}`"
        )

        try:
            db.execute(text(statement))
            db.commit()
        except Exception:
            db.rollback()
            raise

        return {
            "table_name": table_name,
            "index_name": index_name,
            "message": "Index deleted successfully"
        }
