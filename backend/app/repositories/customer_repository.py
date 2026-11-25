# Owner: Member 06
# TODO: implement
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.customer import Customer


def list_customers(db: Session, query: str | None = None):
    statement = select(Customer).order_by(Customer.id.desc())

    if query:
        pattern = f"%{query}%"
        statement = statement.where(
            or_(
                Customer.name.ilike(pattern),
                Customer.email.ilike(pattern),
                Customer.phone.ilike(pattern),
            )
        )

    return db.scalars(statement).all()


def get_customer(db: Session, customer_id: int):
    return db.get(Customer, customer_id)


def create_customer(db: Session, data: dict):
    customer = Customer(**data)
    db.add(customer)
    db.flush()
    return customer


def update_customer(db: Session, customer: Customer, data: dict):
    for field, value in data.items():
        setattr(customer, field, value)

    db.flush()
    return customer


def delete_customer(db: Session, customer: Customer):
    db.delete(customer)
    db.flush()