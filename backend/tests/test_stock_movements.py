# Owner: Member 08
"""
Automated backend unit & API tests for Member 08:
  - GET  /api/v1/stock-movements
  - GET  /api/v1/stock-movements/{id}
  - GET  /api/v1/stock-adjustments
  - GET  /api/v1/stock-adjustments/{id}
  - POST /api/v1/stock-adjustments
  - GET  /api/v1/returns
  - POST /api/v1/returns

Verifies:
  1. Immutable stock movements listing, filtering, single lookup, and 404.
  2. Stock adjustment creation in PENDING status, auto-resolved quantity_before
     from inventory, computed quantity_difference, duplicate reference 409,
     duplicate variant_id 400, negative quantity 422, manual quantity_difference 422,
     and strict non-mutation of inventory.quantity_on_hand and stock_movements.
  3. Sales return creation in PENDING status, computed refund_subtotal and
     total_refund_amount, rejection of non-COMPLETED sales (400), rejection of
     sale_item_id not belonging to sale_id (400), rejection of return quantity <= 0 (422),
     rejection of return quantity exceeding remaining returnable quantity across multiple
     returns (400), rejection of manual refund_subtotal (422), and strict non-mutation of
     inventory.quantity_on_hand and stock_movements.
"""

import inspect as py_inspect
import re
from typing import Any, Dict, Generator, Optional

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.routing import APIRoute
from pydantic import BaseModel, TypeAdapter, ValidationError
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.v1.endpoints import stock_movements as stock_movements_ep
from app.models.stock_movement import Base


class _SyncResponse:
    def __init__(self, status_code: int, body: Any):
        self.status_code = status_code
        self._body = body

    def json(self) -> Any:
        return self._body


class _InProcessFastAPIClient:
    """
    Deterministic synchronous in-process test client for FastAPI APIRouter apps.
    Executes actual APIRoute handlers, Pydantic v2 request/response validation,
    and dependency overrides without spawning background asyncio socketpair threads.
    """

    def __init__(self, app: FastAPI):
        self.app = app

    def _resolve_dependency(self, dep_callable: Any, stack: list) -> Any:
        target = self.app.dependency_overrides.get(dep_callable, dep_callable)
        sig = py_inspect.signature(target)
        kwargs: Dict[str, Any] = {}
        for name, param in sig.parameters.items():
            default = param.default
            if hasattr(default, "dependency") and default.dependency is not None:
                kwargs[name] = self._resolve_dependency(default.dependency, stack)
        result = target(**kwargs)
        if py_inspect.isgenerator(result):
            stack.append(result)
            return next(result)
        return result

    def request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> _SyncResponse:
        params = params or {}
        for route in self.app.routes:
            if not isinstance(route, APIRoute) or method.upper() not in route.methods:
                continue
            pattern = "^" + re.sub(r"\{(\w+)\}", r"(?P<\1>[^/]+)", route.path) + "$"
            match = re.match(pattern, path)
            if not match:
                continue

            gen_stack: list = []
            try:
                sig = py_inspect.signature(route.endpoint)
                call_kwargs: Dict[str, Any] = {}

                for name, param in sig.parameters.items():
                    default = param.default
                    annotation = param.annotation

                    if hasattr(default, "dependency") and default.dependency is not None:
                        call_kwargs[name] = self._resolve_dependency(
                            default.dependency, gen_stack
                        )
                    elif name in match.groupdict():
                        raw_val = match.groupdict()[name]
                        call_kwargs[name] = (
                            int(raw_val) if annotation is int else raw_val
                        )
                    elif (
                        py_inspect.isclass(annotation)
                        and issubclass(annotation, BaseModel)
                    ):
                        call_kwargs[name] = annotation.model_validate(json or {})
                    elif name in params:
                        raw_q = params[name]
                        call_kwargs[name] = (
                            int(raw_q)
                            if annotation is int and raw_q is not None
                            else raw_q
                        )
                    else:
                        call_kwargs[name] = getattr(default, "default", None)

                result = route.endpoint(**call_kwargs)
                status_code = route.status_code or 200
                if route.response_model is not None:
                    adapter = TypeAdapter(route.response_model)
                    validated = adapter.validate_python(result)
                    body = adapter.dump_python(validated, mode="json")
                else:
                    body = result
                return _SyncResponse(status_code, body)
            except ValidationError as exc:
                return _SyncResponse(422, {"detail": exc.errors()})
            except HTTPException as exc:
                return _SyncResponse(exc.status_code, {"detail": exc.detail})
            finally:
                for gen in reversed(gen_stack):
                    try:
                        next(gen)
                    except StopIteration:
                        pass

        return _SyncResponse(404, {"detail": "Not Found"})

    def get(
        self, path: str, params: Optional[Dict[str, Any]] = None
    ) -> _SyncResponse:
        return self.request("GET", path, params=params)

    def post(
        self, path: str, json: Optional[Dict[str, Any]] = None
    ) -> _SyncResponse:
        return self.request("POST", path, json=json)


def _seed_test_database(session: Session) -> None:
    session.execute(
        text(
            """
            CREATE TABLE categories (
                category_id INTEGER PRIMARY KEY,
                category_name VARCHAR(100) NOT NULL
            )
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE products (
                product_id INTEGER PRIMARY KEY,
                product_name VARCHAR(150) NOT NULL,
                category_id INTEGER NOT NULL
            )
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE sizes (
                size_id INTEGER PRIMARY KEY,
                size_name VARCHAR(50) NOT NULL
            )
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE colours (
                colour_id INTEGER PRIMARY KEY,
                colour_name VARCHAR(50) NOT NULL
            )
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE product_variants (
                variant_id INTEGER PRIMARY KEY,
                product_id INTEGER NOT NULL,
                size_id INTEGER NOT NULL,
                colour_id INTEGER NOT NULL,
                sku VARCHAR(100) NOT NULL UNIQUE
            )
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE inventory (
                inventory_id INTEGER PRIMARY KEY,
                variant_id INTEGER NOT NULL UNIQUE,
                quantity_on_hand INTEGER NOT NULL DEFAULT 0,
                reorder_level INTEGER NOT NULL DEFAULT 10
            )
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE customers (
                customer_id INTEGER PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100)
            )
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE users (
                user_id INTEGER PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                full_name VARCHAR(100) NOT NULL,
                role_id INTEGER
            )
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO users (user_id, username, full_name, role_id) VALUES
            (1, 'sysadmin', 'System Admin', 1),
            (2, 'store_mgr', 'Store Manager', 2)
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE sales (
                sale_id INTEGER PRIMARY KEY,
                customer_id INTEGER,
                invoice_number VARCHAR(50) NOT NULL UNIQUE,
                sale_date DATETIME NOT NULL,
                total_amount NUMERIC(12, 2) NOT NULL,
                status VARCHAR(20) NOT NULL
            )
            """
        )
    )
    session.execute(
        text(
            """
            CREATE TABLE sale_items (
                sale_item_id INTEGER PRIMARY KEY,
                sale_id INTEGER NOT NULL,
                variant_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price NUMERIC(10, 2) NOT NULL
            )
            """
        )
    )

    session.execute(
        text(
            """
            INSERT INTO categories (category_id, category_name) VALUES
            (1, 'Menswear / Knitwear'),
            (2, 'Kids / Cotton Basics')
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO products (product_id, product_name, category_id) VALUES
            (10, 'Classic Pique Polo', 1),
            (20, 'Kids Cotton Tee', 2)
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO sizes (size_id, size_name) VALUES
            (1, 'M'),
            (2, 'L')
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO colours (colour_id, colour_name) VALUES
            (1, 'Navy'),
            (2, 'Black')
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO product_variants (variant_id, product_id, size_id, colour_id, sku) VALUES
            (101, 10, 1, 1, 'SP-POLO-NVY-M'),
            (102, 20, 2, 2, 'SP-KIDS-TEE-BLK-L')
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO inventory (inventory_id, variant_id, quantity_on_hand, reorder_level) VALUES
            (1, 101, 240, 40),
            (2, 102, 118, 25)
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO customers (customer_id, first_name, last_name) VALUES
            (1, 'Aarav', 'Mehta'),
            (2, 'Priya', 'Nair')
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO sales (sale_id, customer_id, invoice_number, sale_date, total_amount, status) VALUES
            (2048, 1, 'INV-2026-2048', '2026-11-16 10:30:00', 4800.00, 'COMPLETED'),
            (2049, 2, 'INV-2026-2049', '2026-11-17 09:00:00', 2400.00, 'PENDING'),
            (2050, 2, 'INV-2026-2050', '2026-11-17 09:30:00', 1600.00, 'CANCELLED')
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO sale_items (sale_item_id, sale_id, variant_id, quantity, unit_price) VALUES
            (5001, 2048, 101, 4, 800.00),
            (5002, 2048, 102, 2, 800.00),
            (5003, 2049, 101, 3, 800.00)
            """
        )
    )

    session.execute(
        text(
            """
            INSERT INTO stock_movements (
                movement_id, variant_id, movement_type, quantity,
                reference_type, reference_id, movement_date, notes
            ) VALUES
            (1001, 101, 'PURCHASE', 240, 'purchase_orders', 501, '2026-11-15 09:00:00', 'Initial batch received'),
            (1002, 101, 'SALE', 4, 'sales', 2048, '2026-11-16 10:35:00', 'Retail sale INV-2026-2048'),
            (1003, 102, 'ADJUSTMENT_OUT', 2, 'stock_adjustments', 2101, '2026-11-17 11:00:00', 'Cycle count variance')
            """
        )
    )

    session.execute(
        text(
            """
            INSERT INTO stock_adjustments (
                adjustment_id, adjustment_reference, adjustment_date, adjustment_type,
                reason, status, created_by, approved_by, created_at, updated_at
            ) VALUES (
                2101, 'ADJ-2026-2101', '2026-11-17 10:45:00', 'PHYSICAL_COUNT',
                'Monthly shelf reconciliation', 'COMPLETED', 1, 2,
                '2026-11-17 10:45:00', '2026-11-17 11:00:00'
            )
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO stock_adjustment_items (
                adjustment_item_id, adjustment_id, variant_id,
                quantity_before, quantity_after, item_reason
            ) VALUES (
                1, 2101, 102, 120, 118, 'Two units missing on rack B'
            )
            """
        )
    )

    session.execute(
        text(
            """
            INSERT INTO sales_returns (
                return_id, sale_id, return_date, return_reason,
                total_refund_amount, return_status, notes, created_at
            ) VALUES (
                3011, 2048, '2026-11-17 14:00:00', 'Size exchange return',
                800.00, 'COMPLETED', 'Tag intact', '2026-11-17 14:00:00'
            )
            """
        )
    )
    session.execute(
        text(
            """
            INSERT INTO sales_return_items (
                return_item_id, return_id, sale_item_id, quantity, refund_unit_price
            ) VALUES (
                1, 3011, 5001, 1, 800.00
            )
            """
        )
    )
    session.commit()


@pytest.fixture()
def test_env():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )

    with TestingSessionLocal() as session:
        _seed_test_database(session)

    app = FastAPI()
    app.include_router(stock_movements_ep.router, prefix="/api/v1")

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[stock_movements_ep.get_db] = override_get_db
    client = _InProcessFastAPIClient(app)
    return client, TestingSessionLocal


def test_list_and_filter_stock_movements(test_env):
    client, _ = test_env

    resp = client.get("/api/v1/stock-movements")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 3
    assert data[0]["movement_id"] == 1003
    assert data[0]["sku"] == "SP-KIDS-TEE-BLK-L"

    # Filter by movement_type
    resp_type = client.get(
        "/api/v1/stock-movements", params={"movement_type": "PURCHASE"}
    )
    assert resp_type.status_code == 200
    assert len(resp_type.json()) == 1
    assert resp_type.json()[0]["movement_id"] == 1001

    # Search by SKU
    resp_search = client.get(
        "/api/v1/stock-movements", params={"search": "SP-POLO-NVY-M"}
    )
    assert resp_search.status_code == 200
    assert len(resp_search.json()) == 2


def test_get_stock_movement_by_id_and_404(test_env):
    client, _ = test_env

    resp = client.get("/api/v1/stock-movements/1001")
    assert resp.status_code == 200
    body = resp.json()
    assert body["movement_id"] == 1001
    assert body["movement_type"] == "PURCHASE"
    assert body["quantity"] == 240
    assert body["product_name"] == "Classic Pique Polo"

    resp_404 = client.get("/api/v1/stock-movements/99999")
    assert resp_404.status_code == 404


def test_list_and_get_stock_adjustments(test_env):
    client, _ = test_env

    variants_resp = client.get("/api/v1/stock-adjustments/product-variants")
    assert variants_resp.status_code == 200
    variants = variants_resp.json()
    assert len(variants) == 2
    assert variants[0]["variant_id"] == 101
    assert variants[0]["sku"] == "SP-POLO-NVY-M"
    assert variants[0]["current_quantity_on_hand"] == 240
    assert variants[1]["variant_id"] == 102
    assert variants[1]["current_quantity_on_hand"] == 118

    resp = client.get("/api/v1/stock-adjustments")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["adjustment_reference"] == "ADJ-2026-2101"
    assert items[0]["net_quantity_difference"] == -2
    assert items[0]["items"][0]["quantity_difference"] == -2

    single = client.get("/api/v1/stock-adjustments/2101")
    assert single.status_code == 200
    assert single.json()["adjustment_id"] == 2101

    missing = client.get("/api/v1/stock-adjustments/99999")
    assert missing.status_code == 404


def test_create_stock_adjustment_pending_and_no_inventory_mutation(test_env):
    client, SessionLocal = test_env

    payload = {
        "adjustment_reference": "ADJ-2026-2105",
        "adjustment_type": "PHYSICAL_COUNT",
        "reason": "Spot audit on menswear shelf",
        "created_by": 1,
        "items": [
            {
                "variant_id": 101,
                "quantity_after": 245,
                "item_reason": "Found 5 unpacked units in reserve carton",
            }
        ],
    }
    resp = client.post("/api/v1/stock-adjustments", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["adjustment_reference"] == "ADJ-2026-2105"
    assert body["status"] == "PENDING"
    assert len(body["items"]) == 1
    # quantity_before auto-resolved from inventory (240)
    assert body["items"][0]["quantity_before"] == 240
    assert body["items"][0]["quantity_after"] == 245
    assert body["items"][0]["quantity_difference"] == 5
    assert body["net_quantity_difference"] == 5

    # Verify inventory.quantity_on_hand and stock_movements were NOT modified
    with SessionLocal() as db:
        inv_qty = db.execute(
            text("SELECT quantity_on_hand FROM inventory WHERE variant_id = 101")
        ).scalar_one()
        mov_count = db.execute(
            text("SELECT COUNT(*) FROM stock_movements")
        ).scalar_one()
        assert inv_qty == 240
        assert mov_count == 3

    # Regression test: create stock adjustment with created_by = null (unauthenticated local LIVE mode)
    null_creator_payload = {
        "adjustment_reference": "ADJ-2026-2106",
        "adjustment_type": "PHYSICAL_COUNT",
        "reason": "Unauthenticated local live adjustment with created_by = null",
        "created_by": None,
        "items": [
            {
                "variant_id": 102,
                "quantity_before": 118,
                "quantity_after": 120,
                "item_reason": "Two units located on rack C",
            }
        ],
    }
    resp_null_creator = client.post(
        "/api/v1/stock-adjustments", json=null_creator_payload
    )
    assert resp_null_creator.status_code == 201
    null_creator_body = resp_null_creator.json()
    assert null_creator_body["adjustment_reference"] == "ADJ-2026-2106"
    assert null_creator_body["status"] == "PENDING"
    assert null_creator_body["created_by"] is None
    assert null_creator_body["net_quantity_difference"] == 2

    # Confirm inventory.quantity_on_hand for variant 102 remains 118
    with SessionLocal() as db:
        inv_qty_102 = db.execute(
            text("SELECT quantity_on_hand FROM inventory WHERE variant_id = 102")
        ).scalar_one()
        assert inv_qty_102 == 118


def test_stock_adjustment_validation_errors(test_env):
    client, SessionLocal = test_env

    # 1. Duplicate adjustment_reference -> 409 Conflict
    dup_ref = {
        "adjustment_reference": "ADJ-2026-2101",
        "adjustment_type": "CORRECTION",
        "reason": "Duplicate ref test",
        "items": [{"variant_id": 101, "quantity_after": 240}],
    }
    assert client.post("/api/v1/stock-adjustments", json=dup_ref).status_code == 409

    # 2. Invalid non-null created_by (e.g. user_id=4 does not exist in users) -> 400 Bad Request (never 500)
    invalid_creator = {
        "adjustment_reference": "ADJ-2026-2198",
        "adjustment_type": "PHYSICAL_COUNT",
        "reason": "Invalid creator FK regression test",
        "created_by": 4,
        "items": [{"variant_id": 101, "quantity_after": 245}],
    }
    resp_invalid_creator = client.post(
        "/api/v1/stock-adjustments", json=invalid_creator
    )
    assert resp_invalid_creator.status_code == 400
    assert "created_by" in resp_invalid_creator.json()["detail"]

    # Confirm no inventory mutation or partial adjustment insertion occurred
    with SessionLocal() as db:
        inv_qty_101 = db.execute(
            text("SELECT quantity_on_hand FROM inventory WHERE variant_id = 101")
        ).scalar_one()
        assert inv_qty_101 == 240

    # 2. Duplicate variant_id within items -> 400 Bad Request
    dup_variant = {
        "adjustment_reference": "ADJ-2026-2199",
        "adjustment_type": "CORRECTION",
        "reason": "Duplicate variant test",
        "items": [
            {"variant_id": 101, "quantity_after": 230},
            {"variant_id": 101, "quantity_after": 235},
        ],
    }
    assert (
        client.post("/api/v1/stock-adjustments", json=dup_variant).status_code
        == 400
    )

    # 3. Negative quantity_after -> 422 Unprocessable Entity
    neg_qty = {
        "adjustment_reference": "ADJ-2026-2200",
        "adjustment_type": "DAMAGE",
        "reason": "Negative quantity test",
        "items": [{"variant_id": 101, "quantity_after": -5}],
    }
    assert (
        client.post("/api/v1/stock-adjustments", json=neg_qty).status_code == 422
    )

    # 4. Submitting generated column quantity_difference manually -> 422
    manual_diff = {
        "adjustment_reference": "ADJ-2026-2201",
        "adjustment_type": "DAMAGE",
        "reason": "Manual generated col test",
        "items": [
            {
                "variant_id": 101,
                "quantity_before": 240,
                "quantity_after": 235,
                "quantity_difference": -5,
            }
        ],
    }
    assert (
        client.post("/api/v1/stock-adjustments", json=manual_diff).status_code
        == 422
    )


def test_list_and_create_sales_return_pending_and_no_inventory_mutation(
    test_env,
):
    client, SessionLocal = test_env

    # Verify read-only eligible sales and line items lookup endpoints
    eligible_sales_resp = client.get("/api/v1/returns/eligible-sales")
    assert eligible_sales_resp.status_code == 200
    eligible_sales = eligible_sales_resp.json()
    # Only sale 2048 is COMPLETED (2049 is PENDING, 2050 is CANCELLED)
    assert len(eligible_sales) == 1
    assert eligible_sales[0]["sale_id"] == 2048
    assert eligible_sales[0]["invoice_number"] == "INV-2026-2048"
    assert len(eligible_sales[0]["items"]) == 2
    item_5001 = next(
        i for i in eligible_sales[0]["items"] if i["sale_item_id"] == 5001
    )
    assert item_5001["quantity"] == 4
    assert item_5001["previously_returned_quantity"] == 1
    assert item_5001["remaining_eligible_quantity"] == 3

    sale_items_resp = client.get("/api/v1/returns/eligible-sales/2048/items")
    assert sale_items_resp.status_code == 200
    assert len(sale_items_resp.json()) == 2

    # Non-completed sale 2049 should return 400 on items lookup
    assert (
        client.get("/api/v1/returns/eligible-sales/2049/items").status_code
        == 400
    )

    list_resp = client.get("/api/v1/returns")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1
    assert list_resp.json()[0]["return_id"] == 3011

    # Sale 2048 item 5001 sold 4 units, 1 unit already returned in RET-3011 -> 3 remaining eligible
    create_payload = {
        "sale_id": 2048,
        "return_reason": "Stitching defect on collar",
        "notes": "Customer requested refund after inspection",
        "items": [
            {
                "sale_item_id": 5001,
                "quantity": 2,
            }
        ],
    }
    create_resp = client.post("/api/v1/returns", json=create_payload)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["sale_id"] == 2048
    assert created["return_status"] == "PENDING"
    assert created["total_refund_amount"] == 1600.0
    assert created["total_quantity_returned"] == 2
    assert created["items"][0]["refund_unit_price"] == 800.0
    assert created["items"][0]["refund_subtotal"] == 1600.0

    # Verify inventory and stock_movements were NOT mutated
    with SessionLocal() as db:
        inv_qty = db.execute(
            text("SELECT quantity_on_hand FROM inventory WHERE variant_id = 101")
        ).scalar_one()
        mov_count = db.execute(
            text("SELECT COUNT(*) FROM stock_movements")
        ).scalar_one()
        assert inv_qty == 240
        assert mov_count == 3


def test_sales_return_validation_rules(test_env):
    client, _ = test_env

    # 1. Non-existent sale -> 404
    missing_sale = {
        "sale_id": 9999,
        "return_reason": "Invalid sale",
        "items": [{"sale_item_id": 5001, "quantity": 1}],
    }
    assert client.post("/api/v1/returns", json=missing_sale).status_code == 404

    # 2. Non-COMPLETED sale (sale 2049 is PENDING) -> 400
    pending_sale = {
        "sale_id": 2049,
        "return_reason": "Cannot return pending sale",
        "items": [{"sale_item_id": 5003, "quantity": 1}],
    }
    assert client.post("/api/v1/returns", json=pending_sale).status_code == 400

    # 3. sale_item_id does not belong to sale_id (5003 belongs to 2049, not 2048) -> 400
    wrong_sale_item = {
        "sale_id": 2048,
        "return_reason": "Mismatched sale item",
        "items": [{"sale_item_id": 5003, "quantity": 1}],
    }
    assert (
        client.post("/api/v1/returns", json=wrong_sale_item).status_code == 400
    )

    # 4. Return quantity <= 0 -> 422
    zero_qty = {
        "sale_id": 2048,
        "return_reason": "Zero qty",
        "items": [{"sale_item_id": 5001, "quantity": 0}],
    }
    assert client.post("/api/v1/returns", json=zero_qty).status_code == 422

    # 5. Return quantity exceeds remaining eligible quantity
    # sale_item 5001 sold 4, already returned 1 in seed -> only 3 remaining eligible
    excess_qty = {
        "sale_id": 2048,
        "return_reason": "Over-return attempt",
        "items": [{"sale_item_id": 5001, "quantity": 4}],
    }
    resp_excess = client.post("/api/v1/returns", json=excess_qty)
    assert resp_excess.status_code == 400
    assert "exceeds remaining eligible" in resp_excess.json()["detail"]

    # 6. Submitting generated column refund_subtotal manually -> 422
    manual_subtotal = {
        "sale_id": 2048,
        "return_reason": "Manual subtotal",
        "items": [
            {
                "sale_item_id": 5002,
                "quantity": 1,
                "refund_unit_price": 800.0,
                "refund_subtotal": 800.0,
            }
        ],
    }
    assert (
        client.post("/api/v1/returns", json=manual_subtotal).status_code == 422
    )
