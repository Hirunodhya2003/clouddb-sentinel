# Owner: Member 09
"""Unit and API tests for Member 09 Sales, Purchase, Inventory, and Summary Reports."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.api.v1.endpoints import reports as reports_ep  # noqa: E402


def _seed_reports_db(engine) -> None:
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE categories (category_id INTEGER PRIMARY KEY, category_name TEXT, status TEXT)"))
        conn.execute(
            text(
                "CREATE TABLE products ("
                "product_id INTEGER PRIMARY KEY, product_code TEXT, product_name TEXT, "
                "category_id INTEGER, base_price NUMERIC, status TEXT)"
            )
        )
        conn.execute(text("CREATE TABLE sizes (size_id INTEGER PRIMARY KEY, size_name TEXT)"))
        conn.execute(text("CREATE TABLE colours (colour_id INTEGER PRIMARY KEY, colour_name TEXT)"))
        conn.execute(
            text(
                "CREATE TABLE product_variants ("
                "variant_id INTEGER PRIMARY KEY, product_id INTEGER, size_id INTEGER, colour_id INTEGER, "
                "sku TEXT, cost_price NUMERIC, selling_price NUMERIC, is_active INTEGER)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE inventory ("
                "inventory_id INTEGER PRIMARY KEY, variant_id INTEGER, "
                "quantity_on_hand INTEGER, reorder_level INTEGER, last_stock_updated TEXT)"
            )
        )
        conn.execute(text("CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, status TEXT)"))
        conn.execute(text("CREATE TABLE suppliers (supplier_id INTEGER PRIMARY KEY, supplier_name TEXT, is_active INTEGER)"))
        conn.execute(
            text(
                "CREATE TABLE sales ("
                "sale_id INTEGER PRIMARY KEY, customer_id INTEGER, invoice_number TEXT, "
                "sale_date TEXT, subtotal NUMERIC, discount_amount NUMERIC, total_amount NUMERIC, status TEXT)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE sale_items ("
                "sale_item_id INTEGER PRIMARY KEY, sale_id INTEGER, variant_id INTEGER, "
                "quantity INTEGER, unit_price NUMERIC, subtotal NUMERIC)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE purchases ("
                "purchase_id INTEGER PRIMARY KEY, supplier_id INTEGER, invoice_number TEXT, "
                "purchase_date TEXT, total_amount NUMERIC, status TEXT)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE purchase_items ("
                "purchase_item_id INTEGER PRIMARY KEY, purchase_id INTEGER, variant_id INTEGER, "
                "quantity INTEGER, unit_cost NUMERIC, subtotal NUMERIC)"
            )
        )

        conn.execute(text("INSERT INTO categories VALUES (1, 'Shirts', 'active'), (2, 'Denim', 'active')"))
        conn.execute(text("INSERT INTO sizes VALUES (1, 'M'), (2, 'L')"))
        conn.execute(text("INSERT INTO colours VALUES (1, 'Navy'), (2, 'Black')"))
        conn.execute(
            text(
                "INSERT INTO products VALUES "
                "(1, 'SH-01', 'Linen Shirt', 1, 4000, 'active'), "
                "(2, 'DN-01', 'Slim Jeans', 2, 5500, 'active')"
            )
        )
        conn.execute(
            text(
                "INSERT INTO product_variants VALUES "
                "(101, 1, 1, 1, 'SH-01-M-NVY', 2200, 4000, 1), "
                "(102, 2, 2, 2, 'DN-01-L-BLK', 3000, 5500, 1), "
                "(103, 1, 2, 2, 'SH-01-L-BLK', 2200, 4000, 1)"
            )
        )
        conn.execute(
            text(
                "INSERT INTO inventory VALUES "
                "(1, 101, 15, 5, '2026-11-20 10:00:00'), "
                "(2, 102, 4, 5, '2026-11-21 10:00:00'), "
                "(3, 103, 0, 5, '2026-11-22 10:00:00')"
            )
        )
        conn.execute(text("INSERT INTO customers VALUES (1, 'Kasun Silva', 'Active')"))
        conn.execute(text("INSERT INTO suppliers VALUES (1, 'Lanka Mills', 1)"))
        conn.execute(
            text(
                "INSERT INTO sales VALUES "
                "(1, 1, 'INV-2001', '2026-11-15 11:00:00', 8000, 500, 7500, 'COMPLETED'), "
                "(2, NULL, 'INV-2002', '2026-11-18 15:00:00', 5500, 0, 5500, 'PENDING')"
            )
        )
        conn.execute(
            text(
                "INSERT INTO sale_items VALUES "
                "(1, 1, 101, 2, 4000, 8000), "
                "(2, 2, 102, 1, 5500, 5500)"
            )
        )
        conn.execute(
            text(
                "INSERT INTO purchases VALUES "
                "(1, 1, 'PO-501', '2026-11-10 09:00:00', 33000, 'RECEIVED'), "
                "(2, 1, 'PO-502', '2026-11-19 09:00:00', 15000, 'PENDING')"
            )
        )
        conn.execute(
            text(
                "INSERT INTO purchase_items VALUES "
                "(1, 1, 101, 15, 2200, 33000), "
                "(2, 2, 102, 5, 3000, 15000)"
            )
        )
