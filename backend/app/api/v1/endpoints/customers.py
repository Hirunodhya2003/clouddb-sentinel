# Owner: Member 06
# TODO: implement
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)
from app.services import customer_service

router = APIRouter(prefix="/customers", tags=["Customers"])

DatabaseSession = Annotated[Session, Depends(get_db)]
CustomerId = Annotated[int, Path(gt=0)]


@router.get("", response_model=list[CustomerResponse])
def list_customers(db: DatabaseSession):
    return customer_service.list_customers(db)


@router.get("/search", response_model=list[CustomerResponse])
def search_customers(
    db: DatabaseSession,
    q: Annotated[str, Query(min_length=1, max_length=150)],
):
    return customer_service.list_customers(db, q.strip())


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: CustomerId, db: DatabaseSession):
    return customer_service.get_customer(db, customer_id)


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(data: CustomerCreate, db: DatabaseSession):
    return customer_service.create_customer(db, data)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: CustomerId,
    data: CustomerUpdate,
    db: DatabaseSession,
):
    return customer_service.update_customer(db, customer_id, data)


@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: CustomerId, db: DatabaseSession):
    customer_service.delete_customer(db, customer_id)
    return Response(status_code=204)