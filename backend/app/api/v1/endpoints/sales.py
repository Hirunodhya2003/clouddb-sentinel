from fastapi import APIRouter, HTTPException, status
from typing import List

from app.schemas.sale import (
    SaleCreate,
    SaleResponse,
    SaleItemResponse
)

from app.services.sales_service import sales_service


router = APIRouter(
    prefix="/api/v1/sales",
    tags=["Sales Management"]
)


@router.post(
    "/",
    response_model=SaleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_sale(sale_data: SaleCreate):
    return sales_service.create_sale(sale_data)


@router.get("/", response_model=List[SaleResponse])
def get_all_sales():
    return sales_service.get_all_sales()


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int):
    sale = sales_service.get_sale_by_id(sale_id)

    if sale is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )

    return sale


@router.get("/{sale_id}/items", response_model=List[SaleItemResponse])
def get_sale_items(sale_id: int):
    sale = sales_service.get_sale_by_id(sale_id)

    if sale is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found"
        )

    return sale.items