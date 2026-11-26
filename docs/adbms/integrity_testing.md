<!-- Owner: Member 06 -->

# integrity testing

TODO

# Member 06 — Customer Integrity Testing

## Scope

Customer management includes creating, viewing, updating, deleting
and searching customer records. Integrity checks verify required
customer names, unique email addresses and valid customer statuses.

## Database constraints

| Rule                       | Database implementation     |
| -------------------------- | --------------------------- |
| Unique customer identifier | Primary key on customers.id |
| Required name              | NOT NULL on customers.name  |
| Nonblank name              | chk_customers_name          |
| Unique non-NULL email      | uq_customers_email          |
| Allowed statuses           | chk_customers_status        |

Email and phone are optional. The API converts empty contact
values to NULL. Multiple customers may have a NULL email.

## Integrity checks

| Check         | Expected behaviour                            |
| ------------- | --------------------------------------------- |
| required_name | Reject an insert with a NULL name             |
| unique_email  | Reject a duplicate non-NULL email             |
| valid_status  | Reject a status other than Active or Inactive |

Each constraint probe runs inside a transaction that is rolled
back. Probe customer records are removed. Auto-increment IDs may
contain gaps after rolled-back inserts.

Check results are stored separately in integrity_check_results.

## Result meanings

| Status | Meaning                                             |
| ------ | --------------------------------------------------- |
| PASS   | The expected constraint rejected the insert         |
| FAIL   | The database accepted the invalid insert            |
| ERROR  | An unexpected database error prevented verification |

## API endpoints

- POST /api/v1/integrity/check
- GET /api/v1/integrity/results

The results endpoint supports an optional run_id filter and a
limit between 1 and 500.

## Running backend tests

Run from the backend directory with MySQL available.

    .\.venv\Scripts\python.exe -m pytest tests/test_customers.py tests/test_integrity_check.py -v

The fixture overrides the database dependency and rolls back test
changes. The integrity probes use separate rolled-back transactions.

## SQL verification

Run these files in MySQL Workbench.

1. database/testing/test_constraints.sql
2. database/testing/test_integrity.sql

The first script checks constraint definitions. The second checks
existing customer data and demonstrates transaction rollback.

## Recorded results

- Backend automated tests — 15 passed.
- Integrity API run — 3 passed, 0 failed, 0 errors.
- SQL constraint and integrity scripts — reported PASS.

The backend test run produced one TestClient dependency
deprecation warning.

## Remaining verification

Frontend execution, saved-result loading after refresh and the
production frontend build require final verification.

- Postman collection run — 10 passed, 0 failed, 0 errors.

- Frontend component tests — 8 passed.
- Frontend production build — passed.
