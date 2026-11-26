
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.repositories import supplier_repository
from app.schemas.supplier import SupplierCreate, SupplierUpdate


def list_suppliers(db: Session, query: str | None = None):
    return supplier_repository.list_suppliers(db, query)


def get_supplier(db: Session, supplier_id: int):
    supplier = supplier_repository.get_supplier(db, supplier_id)

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return supplier


def create_supplier(db: Session, data: SupplierCreate):
    try:
        supplier = supplier_repository.create_supplier(
            db, data.model_dump()
        )
        db.commit()
        db.refresh(supplier)
        return supplier
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Supplier could not be created due to a database conflict",
        )


def update_supplier(db: Session, supplier_id: int, data: SupplierUpdate):
    supplier = get_supplier(db, supplier_id)

    try:
        supplier_repository.update_supplier(
            db,
            supplier,
            data.model_dump(exclude_unset=True),
        )
        db.commit()
        db.refresh(supplier)
        return supplier
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Supplier could not be updated due to a database conflict",
        )


def delete_supplier(db: Session, supplier_id: int):
    supplier = get_supplier(db, supplier_id)

    try:
        supplier_repository.delete_supplier(db, supplier)
        db.commit()
        return {"message": "Supplier deleted successfully"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Supplier cannot be deleted because it is referenced by other records",
        )
