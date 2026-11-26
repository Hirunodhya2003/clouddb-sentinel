
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.supplier import Supplier


def list_suppliers(db: Session, query: str | None = None):
    statement = db.query(Supplier)

    if query:
        pattern = f"%{query}%"
        statement = statement.filter(
            or_(
                Supplier.name.ilike(pattern),
                Supplier.contact.ilike(pattern),
                Supplier.email.ilike(pattern),
                Supplier.phone.ilike(pattern),
                Supplier.city.ilike(pattern),
            )
        )

    return statement.order_by(Supplier.id.desc()).all()


def get_supplier(db: Session, supplier_id: int):
    return db.get(Supplier, supplier_id)


def create_supplier(db: Session, data: dict):
    supplier = Supplier(**data)
    db.add(supplier)
    db.flush()
    return supplier


def update_supplier(db: Session, supplier: Supplier, data: dict):
    for field, value in data.items():
        setattr(supplier, field, value)

    db.flush()
    return supplier


def delete_supplier(db: Session, supplier: Supplier):
    db.delete(supplier)
    db.flush()
