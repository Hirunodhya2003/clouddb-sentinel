# Owner: Member 02
import pytest
from m02_test_utils import make_client


@pytest.fixture
def client():
    return make_client()


def create(client, name="T-Shirts", **extra):
    return client.post("/api/v1/categories", json={"category_name": name, **extra})


def test_create_and_list(client):
    res = create(client, description="Everyday tees")
    assert res.status_code == 201
    assert res.json()["status"] == "active"
    assert [c["category_name"] for c in client.get("/api/v1/categories").json()] == ["T-Shirts"]


def test_duplicate_name_is_rejected(client):
    create(client, "Denim")
    res = create(client, "denim")
    assert res.status_code == 409


def test_blank_name_is_rejected(client):
    assert create(client, "   ").status_code == 422


def test_update_and_get(client):
    cid = create(client, "Hoodies").json()["category_id"]
    res = client.put(f"/api/v1/categories/{cid}", json={"status": "inactive"})
    assert res.status_code == 200
    assert client.get(f"/api/v1/categories/{cid}").json()["status"] == "inactive"


def test_filter_by_status(client):
    create(client, "A")
    create(client, "B", status="inactive")
    names = [c["category_name"] for c in client.get("/api/v1/categories", params={"status": "inactive"}).json()]
    assert names == ["B"]


def test_delete_empty_category(client):
    cid = create(client).json()["category_id"]
    assert client.delete(f"/api/v1/categories/{cid}").status_code == 204
    assert client.get(f"/api/v1/categories/{cid}").status_code == 404


def test_cannot_delete_category_with_products(client):
    cid = create(client).json()["category_id"]
    client.post("/api/v1/products", json={"product_code": "P-1", "product_name": "Tee", "category_id": cid, "base_price": 10})
    assert client.delete(f"/api/v1/categories/{cid}").status_code == 409
