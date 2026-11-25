# Owner: Member 06
# TODO: implement
from sqlalchemy import text

from app.database import engine


def customer_count():
    with engine.connect() as connection:
        return connection.execute(
            text("SELECT COUNT(*) FROM customers")
        ).scalar_one()


def test_integrity_checks_and_saved_results(client):
    count_before = customer_count()

    response = client.post(
        "/api/v1/integrity/check",
        json={
            "checks": [
                "required_name",
                "unique_email",
                "valid_status",
            ]
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    assert body["total"] == 3
    assert body["passed"] == 3
    assert body["failed"] == 0
    assert body["errors"] == 0
    assert len(body["results"]) == 3
    assert all(item["status"] == "PASS" for item in body["results"])

    # Constraint probes must roll back their customer inserts.
    assert customer_count() == count_before

    response = client.get(
        "/api/v1/integrity/results",
        params={"run_id": body["run_id"]},
    )

    assert response.status_code == 200, response.text

    saved_results = response.json()

    assert len(saved_results) == 3
    assert all(
        item["run_id"] == body["run_id"]
        for item in saved_results
    )


def test_invalid_check_name_is_rejected(client):
    response = client.post(
        "/api/v1/integrity/check",
        json={"checks": ["unknown_check"]},
    )

    assert response.status_code == 422, response.text


def test_empty_checks_are_rejected(client):
    response = client.post(
        "/api/v1/integrity/check",
        json={"checks": []},
    )

    assert response.status_code == 422, response.text


def test_duplicate_checks_run_once(client):
    response = client.post(
        "/api/v1/integrity/check",
        json={"checks": ["required_name", "required_name"]},
    )

    assert response.status_code == 200, response.text
    assert response.json()["total"] == 1
    assert response.json()["passed"] == 1