# Owner: Member 04
# TODO: implement

from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.supplier import (
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)
from app.services import supplier_service

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

DatabaseSession = Annotated[Session, Depends(get_db)]
SupplierId = Annotated[int, Path(gt=0)]


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(db: DatabaseSession):
    return supplier_service.list_suppliers(db)


@router.get("/search", response_model=list[SupplierResponse])
def search_suppliers(
    db: DatabaseSession,
    q: Annotated[str, Query(min_length=1, max_length=150)],
):
    return supplier_service.list_suppliers(db, q.strip())


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: SupplierId, db: DatabaseSession):
    return supplier_service.get_supplier(db, supplier_id)


@router.post("", response_model=SupplierResponse, status_code=201)
def create_supplier(data: SupplierCreate, db: DatabaseSession):
    return supplier_service.create_supplier(db, data)


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: SupplierId,
    data: SupplierUpdate,
    db: DatabaseSession,
):
    return supplier_service.update_supplier(db, supplier_id, data)


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: SupplierId, db: DatabaseSession):
    supplier_service.delete_supplier(db, supplier_id)
    return Response(status_code=204)
