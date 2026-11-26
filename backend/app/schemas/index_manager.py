# Owner: Member 05
# Database index management schemas.

from pydantic import BaseModel, Field, ConfigDict


class IndexCreate(BaseModel):
    table_name: str = Field(min_length=1, max_length=64)
    index_name: str = Field(
        min_length=1,
        max_length=64,
        pattern=r"^[A-Za-z][A-Za-z0-9_]*$"
    )
    columns: list[str] = Field(min_length=1)
    is_unique: bool = False


class IndexResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    table_name: str
    index_name: str
    column_name: str | None
    non_unique: int
    sequence: int
