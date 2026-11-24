from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from app.database import engine


INSERT_CUSTOMER = text("""
    INSERT INTO customers (name, email, phone, status)
    VALUES (:name, :email, :phone, :status)
""")


def test_constraint(check_name: str, email: str):
    values = {
        "name": "Integrity Test",
        "email": email,
        "phone": None,
        "status": "Active",
    }

    expected_codes = {
        "required_name": {1048},
        "unique_email": {1062},
        "valid_status": {3819, 4025},
    }

    expected_markers = {
        "required_name": "name",
        "unique_email": "uq_customers_email",
        "valid_status": "chk_customers_status",
    }

    try:
        with engine.connect() as connection:
            transaction = connection.begin()

            try:
                if check_name == "unique_email":
                    connection.execute(INSERT_CUSTOMER, values)

                if check_name == "required_name":
                    values["name"] = None

                if check_name == "valid_status":
                    values["status"] = "INVALID"

                try:
                    connection.execute(INSERT_CUSTOMER, values)
                except DBAPIError as error:
                    arguments = getattr(error.orig, "args", ())
                    code = arguments[0] if arguments else None
                    message = str(error.orig).lower()

                    if (
                        code in expected_codes[check_name]
                        and expected_markers[check_name] in message
                    ):
                        return "PASS", "Expected database constraint rejected the insert."

                    return "ERROR", f"Unexpected database error. Code: {code}"

                return "FAIL", "Database accepted an insert that should be rejected."
            finally:
                transaction.rollback()

    except DBAPIError as error:
        arguments = getattr(error.orig, "args", ())
        code = arguments[0] if arguments else None
        return "ERROR", f"Could not complete the database test. Code: {code}"


def save_results(db: Session, results: list[dict]):
    statement = text("""
        INSERT INTO integrity_check_results (
            run_id,
            check_name,
            status,
            expected_result,
            actual_result
        )
        VALUES (
            :run_id,
            :check_name,
            :status,
            :expected_result,
            :actual_result
        )
    """)

    try:
        db.execute(statement, results)
        db.commit()
    except Exception:
        db.rollback()
        raise


def get_results(
    db: Session,
    run_id: str | None = None,
    limit: int = 100,
):
    if run_id:
        statement = text("""
            SELECT
                id, run_id, check_name, status,
                expected_result, actual_result, checked_at
            FROM integrity_check_results
            WHERE run_id = :run_id
            ORDER BY id
            LIMIT :limit
        """)
        parameters = {"run_id": run_id, "limit": limit}
    else:
        statement = text("""
            SELECT
                id, run_id, check_name, status,
                expected_result, actual_result, checked_at
            FROM integrity_check_results
            ORDER BY id DESC
            LIMIT :limit
        """)
        parameters = {"limit": limit}

    return [
        dict(row)
        for row in db.execute(statement, parameters).mappings().all()
    ]