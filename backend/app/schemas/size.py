from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SizeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    size_id: int
    size_name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
