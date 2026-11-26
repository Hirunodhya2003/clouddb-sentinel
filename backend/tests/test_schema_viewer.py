# Owner: Member 02
import pytest
from m02_test_utils import make_client


@pytest.fixture
def client():
    return make_client()


def test_tables_lists_known_tables(client):
    res = client.get("/api/v1/schema/tables")
    assert res.status_code == 200
    assert {"categories", "products"} <= {t["table_name"] for t in res.json()}


def test_columns_describe_keys_and_types(client):
    tables = {t["table_name"]: t for t in client.get("/api/v1/schema/tables").json()}
    products = tables["products"]
    assert products["primary_key"] == ["product_id"]
    cols = {c["column_name"]: c for c in products["columns"]}
    assert cols["product_id"]["is_primary_key"] is True
    assert cols["category_id"]["is_foreign_key"] is True
    assert cols["product_code"]["is_unique"] is True
    assert cols["product_name"]["nullable"] is False
    assert cols["description"]["nullable"] is True


def test_relationships_include_product_category(client):
    rels = client.get("/api/v1/schema/relationships").json()
    match = [
        r for r in rels
        if r["table_name"] == "products" and r["column_name"] == "category_id"
        and r["referenced_table"] == "categories" and r["referenced_column"] == "category_id"
    ]
    assert len(match) == 1
