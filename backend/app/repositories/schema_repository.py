# Owner: Member 02
# Reads database structure (tables, columns, keys). Uses SQLAlchemy's inspector so it
# works on MySQL in production and on SQLite in the tests. Read-only: it never changes data.
from typing import Any, Dict, List

from sqlalchemy import inspect
from sqlalchemy.orm import Session


class SchemaRepository:
    def __init__(self, db: Session):
        self.db = db

    def _inspector(self):
        return inspect(self.db.get_bind())

    def list_tables(self) -> List[Dict[str, Any]]:
        insp = self._inspector()
        dialect = self.db.get_bind().dialect
        tables = []
        for name in sorted(insp.get_table_names()):
            pk = insp.get_pk_constraint(name).get("constrained_columns") or []
            fk_columns = {c for fk in insp.get_foreign_keys(name) for c in fk["constrained_columns"]}

            unique_columns = set()
            for uq in insp.get_unique_constraints(name):
                if len(uq["column_names"]) == 1:
                    unique_columns.add(uq["column_names"][0])
            for idx in insp.get_indexes(name):
                if idx.get("unique") and len(idx["column_names"]) == 1:
                    unique_columns.add(idx["column_names"][0])

            columns = []
            for col in insp.get_columns(name):
                try:
                    data_type = col["type"].compile(dialect=dialect)
                except Exception:
                    data_type = str(col["type"])
                default = col.get("default")
                columns.append(
                    {
                        "column_name": col["name"],
                        "data_type": data_type,
                        "nullable": bool(col.get("nullable", True)),
                        "default": None if default is None else str(default),
                        "is_primary_key": col["name"] in pk,
                        "is_foreign_key": col["name"] in fk_columns,
                        "is_unique": col["name"] in unique_columns,
                        "auto_increment": bool(col.get("autoincrement")) and col["name"] in pk,
                    }
                )
            tables.append({"table_name": name, "columns": columns, "primary_key": list(pk)})
        return tables

    def list_relationships(self) -> List[Dict[str, Any]]:
        insp = self._inspector()
        rows = []
        for name in sorted(insp.get_table_names()):
            for fk in insp.get_foreign_keys(name):
                options = fk.get("options") or {}
                for local, remote in zip(fk["constrained_columns"], fk["referred_columns"]):
                    rows.append(
                        {
                            "constraint_name": fk.get("name"),
                            "table_name": name,
                            "column_name": local,
                            "referenced_table": fk["referred_table"],
                            "referenced_column": remote,
                            "on_update": options.get("onupdate"),
                            "on_delete": options.get("ondelete"),
                        }
                    )
        return rows
