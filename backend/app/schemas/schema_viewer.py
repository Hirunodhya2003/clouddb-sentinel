# Owner: Member 02
from typing import List, Optional

from pydantic import BaseModel


class ColumnInfo(BaseModel):
    column_name: str
    data_type: str
    nullable: bool
    default: Optional[str] = None
    is_primary_key: bool = False
    is_foreign_key: bool = False
    is_unique: bool = False
    auto_increment: bool = False


class TableInfo(BaseModel):
    table_name: str
    columns: List[ColumnInfo]
    primary_key: List[str]


class RelationshipInfo(BaseModel):
    constraint_name: Optional[str] = None
    table_name: str              # the table that holds the foreign key
    column_name: str
    referenced_table: str
    referenced_column: str
    on_update: Optional[str] = None
    on_delete: Optional[str] = None
