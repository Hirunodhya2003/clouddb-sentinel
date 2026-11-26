# Owner: Member 02
# Register in router.py with:  api_router.include_router(products.router)
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.category import Status
from app.schemas.product import ProductCreate, ProductPage, ProductResponse, ProductUpdate
from app.services.product_service import ProductService
from app.services.service_errors import ServiceError

router = APIRouter(prefix="/products", tags=["Products"])


def get_service(db: Session = Depends(get_db)) -> ProductService:
    return ProductService(ProductRepository(db), CategoryRepository(db))


def _http(exc: ServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("", response_model=ProductPage)
def list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[Status] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    svc: ProductService = Depends(get_service),
):
    items, total = svc.list(search=search, category_id=category_id, status=status, page=page, page_size=page_size)
    return ProductPage(items=items, total=total, page=page, page_size=page_size)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, svc: ProductService = Depends(get_service)):
    try:
        return svc.get(product_id)
    except ServiceError as exc:
        raise _http(exc)


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(payload: ProductCreate, svc: ProductService = Depends(get_service)):
    try:
        return svc.create(payload)
    except ServiceError as exc:
        raise _http(exc)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, payload: ProductUpdate, svc: ProductService = Depends(get_service)):
    try:
        return svc.update(product_id, payload)
    except ServiceError as exc:
        raise _http(exc)


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, svc: ProductService = Depends(get_service)):
    try:
        svc.delete(product_id)
    except ServiceError as exc:
        raise _http(exc)
    return Response(status_code=204)
