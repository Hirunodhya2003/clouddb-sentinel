
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ColorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    colour_id: int
    colour_name: str
    colour_code: Optional[str] = None
    is_active: bool
    created_at: datetime
