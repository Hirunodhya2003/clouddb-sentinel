
# Owner: Member 03
# Tests: Product Variants

import pytest
from unittest.mock import MagicMock

from app.models.product_variant import ProductVariant
from app.repositories.variant_repository import VariantRepository
from app.services.variant_service import VariantService
from app.schemas.variant import VariantCreate, VariantUpdate


@pytest.fixture
def mock_db():
    return MagicMock()


def test_get_all_variants(mock_db):
    expected = [ProductVariant(variant_id=1, sku="SKU-001")]

    mock_db.query.return_value.order_by.return_value.all.return_value = expected

    result = VariantRepository.get_all(mock_db)

    assert result == expected


def test_get_variant_by_id(mock_db):
    expected = ProductVariant(variant_id=1, sku="SKU-001")

    mock_db.query.return_value.filter.return_value.first.return_value = expected

    result = VariantRepository.get_by_id(mock_db, 1)

    assert result == expected


def test_create_variant(mock_db):
    variant_data = VariantCreate(
        product_id=1,
        size_id=1,
        colour_id=1,
        sku="SKU-001",
        cost_price="100.00",
        selling_price="150.00"
    )

    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = VariantService.create_variant(mock_db, variant_data)

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_create_duplicate_sku(mock_db):
    variant_data = VariantCreate(
        product_id=1,
        size_id=1,
        colour_id=1,
        sku="SKU-001",
        cost_price="100.00",
        selling_price="150.00"
    )

    existing = ProductVariant(variant_id=1, sku="SKU-001")

    mock_db.query.return_value.filter.return_value.first.return_value = existing

    with pytest.raises(ValueError, match="already exists"):
        VariantService.create_variant(mock_db, variant_data)


def test_update_variant(mock_db):
    existing = ProductVariant(
        variant_id=1,
        sku="SKU-001",
        cost_price=100,
        selling_price=150
    )

    mock_db.query.return_value.filter.return_value.first.return_value = existing

    update_data = VariantUpdate(selling_price="175.00")

    result = VariantService.update_variant(
        mock_db,
        1,
        update_data
    )

    assert result.selling_price == update_data.selling_price


def test_delete_variant(mock_db):
    existing = ProductVariant(variant_id=1, sku="SKU-001")

    mock_db.query.return_value.filter.return_value.first.return_value = existing

    result = VariantService.delete_variant(mock_db, 1)

    mock_db.delete.assert_called_once_with(existing)
    mock_db.commit.assert_called_once()
    assert result is True


def test_get_missing_variant(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(ValueError, match="Variant not found"):
        VariantService.get_variant_by_id(mock_db, 999)
