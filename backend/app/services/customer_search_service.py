from sqlalchemy.orm import Session

from app.repositories import customer_repository


def search_customers(db: Session, query: str):
    return customer_repository.list_customers(db, query.strip())