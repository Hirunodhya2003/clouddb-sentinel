
from app.schemas.concurrency_test import (
    ConcurrencyTestRequest,
    ConcurrencyTestResponse,
    TransactionResult
)


class ConcurrencyService:

    def run_test(
        self,
        test_data: ConcurrencyTestRequest
    ) -> ConcurrencyTestResponse:

        results = []
        conflicts_detected = 0

        for transaction_id in range(
            1, test_data.transaction_count + 1
        ):
            results.append(
                TransactionResult(
                    transaction_id=transaction_id,
                    status="SUCCESS",
                    message="Transaction completed successfully."
                )
            )

        return ConcurrencyTestResponse(
            isolation_level=test_data.isolation_level,
            transaction_count=test_data.transaction_count,
            results=results,
            conflicts_detected=conflicts_detected,
            summary="Concurrency test simulation completed."
        )


concurrency_service = ConcurrencyService()
