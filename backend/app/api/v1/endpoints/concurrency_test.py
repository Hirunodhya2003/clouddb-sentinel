from fastapi import APIRouter

from app.schemas.concurrency_test import (
    ConcurrencyTestRequest,
    ConcurrencyTestResponse
)

from app.services.concurrency_test_service import concurrency_service


router = APIRouter(
    prefix="/api/v1/concurrency",
    tags=["Concurrency Testing"]
)


@router.post("/test", response_model=ConcurrencyTestResponse)
def run_concurrency_test(test_data: ConcurrencyTestRequest):
    return concurrency_service.run_test(test_data)