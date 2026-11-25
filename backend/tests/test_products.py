# Owner: Member 02
import pytest
from m02_test_utils import make_client


@pytest.fixture
def client():
    return make_client()


@pytest.fixture
def category_id(client):
    return client.post("/api/v1/categories", json={"category_name": "Kids T-Shirts"}).json()["category_id"]


def make_product(client, category_id, code="P-1001", **extra):
    body = {"product_code": code, "product_name": "Organic Tee", "category_id": category_id, "base_price": "2450.00", **extra}
    return client.post("/api/v1/products", json=body)


def test_create_product_returns_category_name(client, category_id):
    res = make_product(client, category_id)
    assert res.status_code == 201
    body = res.json()
    assert body["category_name"] == "Kids T-Shirts"
    assert body["base_price"] == 2450.0


def test_duplicate_code_is_rejected(client, category_id):
    make_product(client, category_id)
    assert make_product(client, category_id, code="p-1001").status_code == 409


def test_unknown_category_is_rejected(client):
    assert make_product(client, 999).status_code == 400


def test_negative_price_is_rejected(client, category_id):
    assert make_product(client, category_id, base_price="-5").status_code == 422


def test_list_search_filter_and_pagination(client, category_id):
    for i in range(1, 6):
        make_product(client, category_id, code=f"P-{i}", product_name=f"Tee {i}")
    page = client.get("/api/v1/products", params={"page": 1, "page_size": 2}).json()
    assert page["total"] == 5 and len(page["items"]) == 2
    found = client.get("/api/v1/products", params={"search": "Tee 3"}).json()
    assert [p["product_code"] for p in found["items"]] == ["P-3"]
    assert client.get("/api/v1/products", params={"category_id": 999}).json()["total"] == 0


def test_update_and_delete(client, category_id):
    pid = make_product(client, category_id).json()["product_id"]
    res = client.put(f"/api/v1/products/{pid}", json={"product_name": "Renamed", "base_price": "99.50"})
    assert res.status_code == 200 and res.json()["product_name"] == "Renamed"
    assert client.delete(f"/api/v1/products/{pid}").status_code == 204
    assert client.get(f"/api/v1/products/{pid}").status_code == 404
