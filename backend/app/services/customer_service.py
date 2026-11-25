# Owner: Member 06
# TODO: implement
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.repositories import customer_repository
from app.schemas.customer import CustomerCreate, CustomerUpdate


def list_customers(db: Session, query: str | None = None):
    return customer_repository.list_customers(db, query)


def get_customer(db: Session, customer_id: int):
    customer = customer_repository.get_customer(db, customer_id)

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found.")

    return customer


def create_customer(db: Session, data: CustomerCreate):
    try:
        customer = customer_repository.create_customer(db, data.model_dump())
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Customer conflicts with a database constraint. Check the email.",
        ) from None

    db.refresh(customer)
    return customer


def update_customer(db: Session, customer_id: int, data: CustomerUpdate):
    customer = get_customer(db, customer_id)

    try:
        customer_repository.update_customer(db, customer, data.model_dump())
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Customer conflicts with a database constraint. Check the email.",
        ) from None

    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int):
    customer = get_customer(db, customer_id)

    try:
        customer_repository.delete_customer(db, customer)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Customer cannot be deleted because of a database constraint.",
        ) from None