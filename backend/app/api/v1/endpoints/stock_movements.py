# Owner: Member 08
"""
FastAPI v1 endpoints for Member 08:
  - GET  /api/v1/stock-movements
  - GET  /api/v1/stock-movements/{movement_id}
  - GET  /api/v1/stock-adjustments
  - GET  /api/v1/stock-adjustments/{adjustment_id}
  - POST /api/v1/stock-adjustments
  - GET  /api/v1/returns
  - POST /api/v1/returns
"""

from typing import Generator, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import app.database.session as _db_session_mod
from app.repositories.stock_movement_repository import StockMovementRepository
from app.schemas.stock_movement import (
    EligibleReturnSaleItemResponse,
    EligibleReturnSaleResponse,
    ProductVariantLookupResponse,
    ReturnCreate,
    ReturnResponse,
    StockAdjustmentCreate,
    StockAdjustmentResponse,
    StockMovementResponse,
)
from app.services.stock_movement_service import StockMovementService


def _fallback_get_db() -> Generator[Session, None, None]:
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Database session dependency (app.database.session.get_db) is not configured."
        ),
    )
    yield  # pragma: no cover


if not hasattr(_db_session_mod, "get_db"):
    setattr(_db_session_mod, "get_db", _fallback_get_db)

get_db = getattr(_db_session_mod, "get_db")

router = APIRouter(tags=["Stock Movements, Adjustments & Returns"])


def get_stock_movement_service(
    db: Session = Depends(get_db),
) -> StockMovementService:
    repo = StockMovementRepository(db)
    return StockMovementService(repo)


# ---------------------------------------------------------------------------
# STOCK MOVEMENTS
# ---------------------------------------------------------------------------
@router.get(
    "/stock-movements",
    response_model=List[StockMovementResponse],
    summary="List stock movements ledger entries",
)
def list_stock_movements(
    search: Optional[str] = Query(
        default=None, description="Search by movement ID, SKU, product, or notes"
    ),
    movement_type: Optional[str] = Query(
        default=None, description="Filter by movement_type ENUM"
    ),
    variant_id: Optional[int] = Query(
        default=None, description="Filter by product variant_id"
    ),
    reference_type: Optional[str] = Query(
        default=None, description="Filter by reference_type"
    ),
    from_date: Optional[str] = Query(
        default=None, description="Start date filter (YYYY-MM-DD)"
    ),
    to_date: Optional[str] = Query(
        default=None, description="End date filter (YYYY-MM-DD)"
    ),
    service: StockMovementService = Depends(get_stock_movement_service),
) -> List[StockMovementResponse]:
    return service.list_stock_movements(
        search=search,
        movement_type=movement_type,
        variant_id=variant_id,
        reference_type=reference_type,
        from_date=from_date,
        to_date=to_date,
    )


@router.get(
    "/stock-movements/{movement_id}",
    response_model=StockMovementResponse,
    summary="Get a single stock movement ledger entry by ID",
)
def get_stock_movement(
    movement_id: int,
    service: StockMovementService = Depends(get_stock_movement_service),
) -> StockMovementResponse:
    return service.get_stock_movement(movement_id)


# ---------------------------------------------------------------------------
# STOCK ADJUSTMENTS
# ---------------------------------------------------------------------------
@router.get(
    "/stock-adjustments/product-variants",
    response_model=List[ProductVariantLookupResponse],
    summary="List product variants with current inventory quantity for Create Stock Adjustment",
)
def list_product_variants_for_adjustments(
    service: StockMovementService = Depends(get_stock_movement_service),
) -> List[ProductVariantLookupResponse]:
    return service.list_product_variants_for_adjustments()


@router.get(
    "/stock-adjustments",
    response_model=List[StockAdjustmentResponse],
    summary="List stock adjustments and their line items",
)
def list_stock_adjustments(
    search: Optional[str] = Query(
        default=None, description="Search by reference, SKU, product, or reason"
    ),
    status: Optional[str] = Query(
        default=None, description="Filter by adjustment status"
    ),
    adjustment_type: Optional[str] = Query(
        default=None, description="Filter by adjustment_type ENUM"
    ),
    from_date: Optional[str] = Query(
        default=None, description="Start date filter (YYYY-MM-DD)"
    ),
    to_date: Optional[str] = Query(
        default=None, description="End date filter (YYYY-MM-DD)"
    ),
    service: StockMovementService = Depends(get_stock_movement_service),
) -> List[StockAdjustmentResponse]:
    return service.list_stock_adjustments(
        search=search,
        status_filter=status,
        adjustment_type=adjustment_type,
        from_date=from_date,
        to_date=to_date,
    )


@router.get(
    "/stock-adjustments/{adjustment_id}",
    response_model=StockAdjustmentResponse,
    summary="Get a single stock adjustment and its items by ID",
)
def get_stock_adjustment(
    adjustment_id: int,
    service: StockMovementService = Depends(get_stock_movement_service),
) -> StockAdjustmentResponse:
    return service.get_stock_adjustment(adjustment_id)


@router.post(
    "/stock-adjustments",
    response_model=StockAdjustmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new stock adjustment in PENDING status",
)
def create_stock_adjustment(
    payload: StockAdjustmentCreate,
    service: StockMovementService = Depends(get_stock_movement_service),
) -> StockAdjustmentResponse:
    return service.create_stock_adjustment(payload)


# ---------------------------------------------------------------------------
# SALES RETURNS
# ---------------------------------------------------------------------------
@router.get(
    "/returns/eligible-sales",
    response_model=List[EligibleReturnSaleResponse],
    summary="List COMPLETED sales and their return-eligible line items for Create Return",
)
def list_eligible_sales_for_returns(
    service: StockMovementService = Depends(get_stock_movement_service),
) -> List[EligibleReturnSaleResponse]:
    return service.list_eligible_sales_for_returns()


@router.get(
    "/returns/eligible-sales/{sale_id}/items",
    response_model=List[EligibleReturnSaleItemResponse],
    summary="List return-eligible line items belonging to a specific COMPLETED sale",
)
def list_eligible_sale_items_for_return(
    sale_id: int,
    service: StockMovementService = Depends(get_stock_movement_service),
) -> List[EligibleReturnSaleItemResponse]:
    return service.list_eligible_sale_items_for_return(sale_id)


@router.get(
    "/returns",
    response_model=List[ReturnResponse],
    summary="List sales returns and their returned items",
)
def list_sales_returns(
    search: Optional[str] = Query(
        default=None, description="Search by return ID, invoice, customer, or reason"
    ),
    return_status: Optional[str] = Query(
        default=None, description="Filter by return_status ENUM"
    ),
    sale_id: Optional[int] = Query(
        default=None, description="Filter by sale_id"
    ),
    from_date: Optional[str] = Query(
        default=None, description="Start date filter (YYYY-MM-DD)"
    ),
    to_date: Optional[str] = Query(
        default=None, description="End date filter (YYYY-MM-DD)"
    ),
    service: StockMovementService = Depends(get_stock_movement_service),
) -> List[ReturnResponse]:
    return service.list_sales_returns(
        search=search,
        return_status=return_status,
        sale_id=sale_id,
        from_date=from_date,
        to_date=to_date,
    )


@router.post(
    "/returns",
    response_model=ReturnResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new sales return in PENDING status",
)
def create_sales_return(
    payload: ReturnCreate,
    service: StockMovementService = Depends(get_stock_movement_service),
) -> ReturnResponse:
    return service.create_sales_return(payload)
