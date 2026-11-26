
# Owner: Member 03
# API Endpoints: Views Explorer

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.views_explorer import (
    ProductSummarySchema,
    VariantDetailsSchema
)
from app.services.views_explorer_service import ViewsExplorerService


router = APIRouter(
    prefix="/views",
    tags=["Views Explorer"]
)


@router.get(
    "/products",
    response_model=list[ProductSummarySchema]
)
def get_product_summary(db: Session = Depends(get_db)):
    return ViewsExplorerService.get_product_summary(db)


@router.get(
    "/products/{product_id}",
    response_model=ProductSummarySchema
)
def get_product_summary_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    result = ViewsExplorerService.get_product_summary_by_id(
        db,
        product_id
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product summary not found"
        )

    return result


@router.get(
    "/variants",
    response_model=list[VariantDetailsSchema]
)
def get_variant_details(db: Session = Depends(get_db)):
    return ViewsExplorerService.get_variant_details(db)


@router.get(
    "/variants/{variant_id}",
    response_model=VariantDetailsSchema
)
def get_variant_details_by_id(
    variant_id: int,
    db: Session = Depends(get_db)
):
    result = ViewsExplorerService.get_variant_details_by_id(
        db,
        variant_id
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Variant details not found"
        )

    return result
