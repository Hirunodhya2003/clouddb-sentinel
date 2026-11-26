# Owner: Member 06
# TODO: implement
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


CheckName = Literal[
    "required_name",
    "unique_email",
    "valid_status",
]


class IntegrityCheckRequest(BaseModel):
    checks: list[CheckName] = Field(
        default_factory=lambda: [
            "required_name",
            "unique_email",
            "valid_status",
        ],
        min_length=1,
        max_length=3,
    )


class IntegrityCheckResult(BaseModel):
    id: int
    run_id: str
    check_name: str
    status: Literal["PASS", "FAIL", "ERROR"]
    expected_result: str
    actual_result: str
    checked_at: datetime


class IntegrityCheckResponse(BaseModel):
    run_id: str
    total: int
    passed: int
    failed: int
    errors: int
    results: list[IntegrityCheckResult]