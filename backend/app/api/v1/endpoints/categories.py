# Owner: Member 02
# Register in router.py with:  api_router.include_router(categories.router)
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate, Status
from app.services.category_service import CategoryService
from app.services.service_errors import ServiceError

router = APIRouter(prefix="/categories", tags=["Categories"])


def get_service(db: Session = Depends(get_db)) -> CategoryService:
    return CategoryService(CategoryRepository(db))


def _http(exc: ServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("", response_model=List[CategoryResponse])
def list_categories(search: Optional[str] = None, status: Optional[Status] = None, svc: CategoryService = Depends(get_service)):
    return svc.list(search=search, status=status)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, svc: CategoryService = Depends(get_service)):
    try:
        return svc.get(category_id)
    except ServiceError as exc:
        raise _http(exc)


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(payload: CategoryCreate, svc: CategoryService = Depends(get_service)):
    try:
        return svc.create(payload)
    except ServiceError as exc:
        raise _http(exc)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, payload: CategoryUpdate, svc: CategoryService = Depends(get_service)):
    try:
        return svc.update(category_id, payload)
    except ServiceError as exc:
        raise _http(exc)


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, svc: CategoryService = Depends(get_service)):
    try:
        svc.delete(category_id)
    except ServiceError as exc:
        raise _http(exc)
    return Response(status_code=204)
