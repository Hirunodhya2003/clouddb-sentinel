import pytest
from unittest.mock import MagicMock

from app.services.views_explorer_service import ViewsExplorerService


@pytest.fixture
def mock_db():
    return MagicMock()


def test_get_product_summary_empty(mock_db):
    mock_db.execute.return_value.mappings.return_value.all.return_value = []

    result = ViewsExplorerService.get_product_summary(mock_db)

    assert result == []


def test_get_variant_details_empty(mock_db):
    mock_db.execute.return_value.mappings.return_value.all.return_value = []

    result = ViewsExplorerService.get_variant_details(mock_db)

    assert result == []


def test_get_product_summary_by_id_not_found(mock_db):
    mock_db.execute.return_value.mappings.return_value.first.return_value = None

    result = ViewsExplorerService.get_product_summary_by_id(
        mock_db,
        999
    )

    assert result is None


def test_get_variant_details_by_id_not_found(mock_db):
    mock_db.execute.return_value.mappings.return_value.first.return_value = None

    result = ViewsExplorerService.get_variant_details_by_id(
        mock_db,
        999
    )

    assert result is None


def test_product_summary_query_uses_correct_view(mock_db):
    mock_db.execute.return_value.mappings.return_value.all.return_value = []

    ViewsExplorerService.get_product_summary(mock_db)

    executed_query = mock_db.execute.call_args[0][0]

    assert "product_view" in str(executed_query)


def test_variant_details_query_uses_correct_view(mock_db):
    mock_db.execute.return_value.mappings.return_value.all.return_value = []

    ViewsExplorerService.get_variant_details(mock_db)

    executed_query = mock_db.execute.call_args[0][0]

    assert "variant_details_view" in str(executed_query)
