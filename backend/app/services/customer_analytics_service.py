from sqlalchemy.orm import Session

from app.repositories import customer_repository


def get_customer_analytics(db: Session):
    return customer_repository.get_customer_analytics(db)