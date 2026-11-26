
# Owner: Member 03
# API Endpoints: Product Variants

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.variant import (
    VariantCreate,
    VariantUpdate,
    VariantResponse
)
from app.services.variant_service import VariantService


router = APIRouter(
    prefix="/variants",
    tags=["Product Variants"]
)


@router.get("/", response_model=list[VariantResponse])
def get_all_variants(db: Session = Depends(get_db)):
    return VariantService.get_all_variants(db)


@router.get("/{variant_id}", response_model=VariantResponse)
def get_variant(
    variant_id: int,
    db: Session = Depends(get_db)
):
    try:
        return VariantService.get_variant_by_id(db, variant_id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )


@router.post(
    "/",
    response_model=VariantResponse,
    status_code=status.HTTP_201_CREATED
)
def create_variant(
    variant_data: VariantCreate,
    db: Session = Depends(get_db)
):
    try:
        return VariantService.create_variant(db, variant_data)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


@router.put("/{variant_id}", response_model=VariantResponse)
def update_variant(
    variant_id: int,
    update_data: VariantUpdate,
    db: Session = Depends(get_db)
):
    try:
        return VariantService.update_variant(
            db,
            variant_id,
            update_data
        )
    except ValueError as error:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if str(error) == "Variant not found"
            else status.HTTP_400_BAD_REQUEST
        )

        raise HTTPException(
            status_code=status_code,
            detail=str(error)
        )


@router.delete("/{variant_id}")
def delete_variant(
    variant_id: int,
    db: Session = Depends(get_db)
):
    try:
        VariantService.delete_variant(db, variant_id)

        return {
            "message": "Variant deleted successfully"
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )
