
from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class IsolationLevel(str, Enum):
    READ_UNCOMMITTED = "READ UNCOMMITTED"
    READ_COMMITTED = "READ COMMITTED"
    REPEATABLE_READ = "REPEATABLE READ"
    SERIALIZABLE = "SERIALIZABLE"


class ConcurrencyTestRequest(BaseModel):
    transaction_count: int = Field(default=2, ge=2, le=10)
    isolation_level: IsolationLevel = IsolationLevel.READ_COMMITTED


class TransactionResult(BaseModel):
    transaction_id: int
    status: str
    message: str


class ConcurrencyTestResponse(BaseModel):
    isolation_level: IsolationLevel
    transaction_count: int
    results: List[TransactionResult]
    conflicts_detected: int
    summary: str
