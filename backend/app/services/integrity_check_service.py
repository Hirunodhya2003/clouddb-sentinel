# Owner: Member 06
# TODO: implement
from uuid import uuid4

from sqlalchemy.orm import Session

from app.repositories import integrity_repository
from app.schemas.integrity_check import IntegrityCheckRequest


EXPECTED_RESULTS = {
    "required_name": "Reject a customer with a NULL name.",
    "unique_email": "Reject a duplicate non-NULL email.",
    "valid_status": "Reject a status other than Active or Inactive.",
}


def run_checks(db: Session, request: IntegrityCheckRequest):
    run_id = str(uuid4())
    results = []

    for check_name in dict.fromkeys(request.checks):
        test_email = f"integrity-{uuid4().hex}@example.com"

        status, actual_result = integrity_repository.test_constraint(
            check_name,
            test_email,
        )

        results.append({
            "run_id": run_id,
            "check_name": check_name,
            "status": status,
            "expected_result": EXPECTED_RESULTS[check_name],
            "actual_result": actual_result,
        })

    integrity_repository.save_results(db, results)
    saved_results = integrity_repository.get_results(db, run_id)

    return {
        "run_id": run_id,
        "total": len(saved_results),
        "passed": sum(
            result["status"] == "PASS" for result in saved_results
        ),
        "failed": sum(
            result["status"] == "FAIL" for result in saved_results
        ),
        "errors": sum(
            result["status"] == "ERROR" for result in saved_results
        ),
        "results": saved_results,
    }


def get_results(
    db: Session,
    run_id: str | None = None,
    limit: int = 100,
):
    return integrity_repository.get_results(db, run_id, limit)