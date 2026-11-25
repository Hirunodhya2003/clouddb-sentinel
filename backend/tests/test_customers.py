# Owner: Member 06
# TODO: implement
from uuid import uuid4

import pytest


def customer_payload():
    return {
        "name": "Automated Test Customer",
        "email": f"customer-{uuid4().hex}@example.com",
        "phone": "0771234567",
        "status": "Active",
    }


def test_create_and_get_customer(client):
    payload = customer_payload()

    response = client.post("/api/v1/customers", json=payload)

    assert response.status_code == 201, response.text

    created = response.json()

    assert created["id"] > 0
    assert created["name"] == payload["name"]
    assert created["email"] == payload["email"]

    response = client.get(f"/api/v1/customers/{created['id']}")

    assert response.status_code == 200, response.text
    assert response.json()["id"] == created["id"]


def test_update_customer(client):
    response = client.post(
        "/api/v1/customers",
        json=customer_payload(),
    )
    assert response.status_code == 201, response.text

    created = response.json()

    updated_payload = {
        "name": "Updated Customer",
        "email": created["email"],
        "phone": "0711234567",
        "status": "Inactive",
    }

    response = client.put(
        f"/api/v1/customers/{created['id']}",
        json=updated_payload,
    )

    assert response.status_code == 200, response.text

    response = client.get(f"/api/v1/customers/{created['id']}")

    assert response.status_code == 200, response.text
    assert response.json()["name"] == "Updated Customer"
    assert response.json()["status"] == "Inactive"


def test_delete_customer(client):
    response = client.post(
        "/api/v1/customers",
        json=customer_payload(),
    )
    assert response.status_code == 201, response.text

    customer_id = response.json()["id"]

    response = client.delete(f"/api/v1/customers/{customer_id}")

    assert response.status_code == 204, response.text

    response = client.get(f"/api/v1/customers/{customer_id}")

    assert response.status_code == 404


def test_search_customer_by_email(client):
    payload = customer_payload()

    response = client.post("/api/v1/customers", json=payload)
    assert response.status_code == 201, response.text

    customer_id = response.json()["id"]

    response = client.get(
        "/api/v1/customers/search",
        params={"q": payload["email"]},
    )

    assert response.status_code == 200, response.text
    assert [item["id"] for item in response.json()] == [customer_id]


def test_search_without_matches(client):
    response = client.get(
        "/api/v1/customers/search",
        params={"q": uuid4().hex},
    )

    assert response.status_code == 200, response.text
    assert response.json() == []


def test_duplicate_email_is_rejected(client):
    payload = customer_payload()

    response = client.post("/api/v1/customers", json=payload)
    assert response.status_code == 201, response.text

    response = client.post("/api/v1/customers", json=payload)

    assert response.status_code == 409, response.text

    # The failed insert must leave the session usable.
    response = client.get(
        "/api/v1/customers/search",
        params={"q": payload["email"]},
    )

    assert response.status_code == 200, response.text
    assert len(response.json()) == 1


@pytest.mark.parametrize(
    "changes",
    [
        {"name": ""},
        {"name": "   "},
        {"email": "invalid-email"},
        {"status": "INVALID"},
    ],
)
def test_invalid_customer_is_rejected(client, changes):
    payload = customer_payload()
    payload.update(changes)

    response = client.post("/api/v1/customers", json=payload)

    assert response.status_code == 422, response.text


def test_empty_contact_fields_become_null(client):
    payload = customer_payload()
    payload["email"] = ""
    payload["phone"] = ""

    response = client.post("/api/v1/customers", json=payload)

    assert response.status_code == 201, response.text
    assert response.json()["email"] is None
    assert response.json()["phone"] is None