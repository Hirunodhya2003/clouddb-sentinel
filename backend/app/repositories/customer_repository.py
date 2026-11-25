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

def get_customer_analytics(db: Session):
    from sqlalchemy import case, func

    statement = select(
        func.count(Customer.id).label("total_customers"),
        func.coalesce(
            func.sum(case((Customer.status == "Active", 1), else_=0)),
            0,
        ).label("active_customers"),
        func.coalesce(
            func.sum(case((Customer.status == "Inactive", 1), else_=0)),
            0,
        ).label("inactive_customers"),
        func.count(
            func.nullif(func.trim(Customer.email), "")
        ).label("customers_with_email"),
        func.count(
            func.nullif(func.trim(Customer.phone), "")
        ).label("customers_with_phone"),
        func.min(Customer.created_at).label("earliest_registration"),
        func.max(Customer.created_at).label("latest_registration"),
    )

    return dict(db.execute(statement).mappings().one())   