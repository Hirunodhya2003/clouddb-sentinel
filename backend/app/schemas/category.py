# Owner: Member 02
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["active", "inactive"]


class CategoryCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    category_name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)
    status: Status = "active"


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    category_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)
    status: Optional[Status] = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_id: int
    category_name: str
    description: Optional[str] = None
    status: Status
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
