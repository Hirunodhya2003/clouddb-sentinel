# Owner: Member 06
# TODO: implement
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.integrity_check import (
    IntegrityCheckRequest,
    IntegrityCheckResponse,
    IntegrityCheckResult,
)
from app.services import integrity_check_service


router = APIRouter(
    prefix="/integrity",
    tags=["Integrity Checks"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post("/check", response_model=IntegrityCheckResponse)
def run_integrity_check(
    request: IntegrityCheckRequest,
    db: DatabaseSession,
):
    return integrity_check_service.run_checks(db, request)


@router.get("/results", response_model=list[IntegrityCheckResult])
def get_integrity_results(
    db: DatabaseSession,
    run_id: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
):
    return integrity_check_service.get_results(
        db,
        str(run_id) if run_id else None,
        limit,
    )