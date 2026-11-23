# Owner: Member 06
# TODO: implement
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=150)
    email: EmailStr | None = Field(default=None, max_length=254)
    phone: str | None = Field(default=None, max_length=30)
    status: Literal["Active", "Inactive"] = "Active"

    @field_validator("email", "phone", mode="before")
    @classmethod
    def normalize_optional_fields(cls, value):
        if isinstance(value, str):
            return value.strip() or None
        return value


class CustomerUpdate(CustomerCreate):
    pass


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str | None
    phone: str | None
    status: Literal["Active", "Inactive"]
    created_at: datetime
    updated_at: datetime