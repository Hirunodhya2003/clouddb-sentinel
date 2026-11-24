# Owner: Member 09
"""Unit and API tests for Member 09 Executive Dashboard endpoints and services."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.v1.endpoints import dashboard as dashboard_ep  # noqa: E402


def _seed_dashboard_schema(engine) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE categories (
                    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_name TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'active'
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE products (
                    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_code TEXT NOT NULL,
                    product_name TEXT NOT NULL,
                    category_id INTEGER NOT NULL,
                    base_price NUMERIC NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'active'
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE product_variants (
                    variant_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    sku TEXT NOT NULL,
                    cost_price NUMERIC NOT NULL,
                    selling_price NUMERIC NOT NULL,
                    is_active INTEGER NOT NULL DEFAULT 1
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE inventory (
                    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    variant_id INTEGER NOT NULL,
                    quantity_on_hand INTEGER NOT NULL,
                    reorder_level INTEGER NOT NULL DEFAULT 5
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'Active'
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE suppliers (
                    supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    supplier_name TEXT NOT NULL,
                    is_active INTEGER NOT NULL DEFAULT 1
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE sales (
                    sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER,
                    invoice_number TEXT NOT NULL,
                    sale_date TEXT NOT NULL,
                    subtotal NUMERIC NOT NULL,
                    discount_amount NUMERIC NOT NULL DEFAULT 0,
                    total_amount NUMERIC NOT NULL,
                    status TEXT NOT NULL
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE purchases (
                    purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    supplier_id INTEGER NOT NULL,
                    invoice_number TEXT,
                    purchase_date TEXT NOT NULL,
                    total_amount NUMERIC NOT NULL,
                    status TEXT NOT NULL
                )
                """
            )
        )

        conn.execute(text("INSERT INTO categories (category_id, category_name) VALUES (1, 'Menswear'), (2, 'Kids')"))
        conn.execute(
            text(
                "INSERT INTO products (product_id, product_code, product_name, category_id, base_price, status) "
                "VALUES (1, 'P-01', 'Oxford Shirt', 1, 3500, 'active'), (2, 'P-02', 'Kids Tee', 2, 1500, 'active')"
            )
        )
        conn.execute(
            text(
                "INSERT INTO product_variants (variant_id, product_id, sku, cost_price, selling_price, is_active) "
                "VALUES (10, 1, 'OXF-M-BLU', 2000, 3500, 1), (11, 2, 'KID-S-RED', 800, 1500, 1)"
            )
        )
        conn.execute(
            text(
                "INSERT INTO inventory (variant_id, quantity_on_hand, reorder_level) "
                "VALUES (10, 20, 5), (11, 3, 5)"
            )
        )
        conn.execute(text("INSERT INTO customers (id, name, status) VALUES (1, 'Nimal Perera', 'Active')"))
        conn.execute(text("INSERT INTO suppliers (supplier_id, supplier_name, is_active) VALUES (1, 'Ceylon Fabrics', 1)"))
        conn.execute(
            text(
                "INSERT INTO sales (sale_id, customer_id, invoice_number, sale_date, subtotal, discount_amount, total_amount, status) "
                "VALUES "
                "(1, 1, 'INV-1001', '2026-11-20 10:15:00', 7000, 500, 6500, 'COMPLETED'), "
                "(2, NULL, 'INV-1002', '2026-11-21 14:30:00', 3500, 0, 3500, 'COMPLETED'), "
                "(3, 1, 'INV-1003', '2026-11-22 09:00:00', 1500, 0, 1500, 'PENDING')"
            )
        )
        conn.execute(
            text(
                "INSERT INTO purchases (purchase_id, supplier_id, invoice_number, purchase_date, total_amount, status) "
                "VALUES (1, 1, 'SUP-901', '2026-11-19 08:00:00', 40000, 'RECEIVED')"
            )
        )


@pytest.fixture
def dashboard_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _seed_dashboard_schema(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        with TestingSession() as db:
            yield db

    app = FastAPI()
    app.include_router(dashboard_ep.router, prefix="/api/v1")
    app.dependency_overrides[dashboard_ep.get_db] = override_get_db
    return TestClient(app)


def test_dashboard_overview_returns_cards_charts_and_recent_activity(dashboard_client):
    res = dashboard_client.get("/api/v1/dashboard")
    assert res.status_code == 200
    body = res.json()

    cards = {c["key"]: c for c in body["summary_cards"]}
    assert cards["gross_revenue"]["value"] == 10000.0
    assert cards["purchase_spend"]["value"] == 40000.0
    # 20 * 3500 + 3 * 1500 = 74,500
    assert cards["inventory_valuation"]["value"] == 74500.0
    assert cards["low_stock_alerts"]["value"] == 1.0

    assert len(body["sales_chart"]) == 3
    assert len(body["inventory_chart"]) == 2
    assert body["inventory_chart"][0]["category_name"] == "Menswear"
    assert body["inventory_chart"][0]["retail_value"] == 70000.0

    assert len(body["recent_transactions"]) == 4
    assert body["recent_transactions"][0]["reference_number"] == "INV-1003"


def test_dashboard_individual_subendpoints(dashboard_client):
    assert dashboard_client.get("/api/v1/dashboard/summary").status_code == 200
    sales_res = dashboard_client.get("/api/v1/dashboard/sales-chart", params={"days": 7})
    assert sales_res.status_code == 200
    assert len(sales_res.json()) == 3

    inv_res = dashboard_client.get("/api/v1/dashboard/inventory-chart")
    assert inv_res.status_code == 200
    assert inv_res.json()[1]["low_stock_count"] == 1

    recent_res = dashboard_client.get("/api/v1/dashboard/recent-transactions", params={"limit": 2})
    assert recent_res.status_code == 200
    assert len(recent_res.json()) == 2
