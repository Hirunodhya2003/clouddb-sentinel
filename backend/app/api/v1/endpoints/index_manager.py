# Owner: Member 05
# Database index management API endpoints.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.index_manager import IndexCreate
from app.services.index_manager_service import IndexManagerService

router = APIRouter(
    prefix="/index-manager",
    tags=["Index Manager"]
)


@router.get("/")
def get_indexes(db: Session = Depends(get_db)):
    return IndexManagerService.get_indexes(db)


@router.post("/", status_code=201)
def create_index(
    payload: IndexCreate,
    db: Session = Depends(get_db)
):
    try:
        return IndexManagerService.create_index(
            db=db,
            table_name=payload.table_name,
            index_name=payload.index_name,
            columns=payload.columns,
            is_unique=payload.is_unique
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.delete("/{table_name}/{index_name}")
def delete_index(
    table_name: str,
    index_name: str,
    db: Session = Depends(get_db)
):
    try:
        return IndexManagerService.delete_index(
            db=db,
            table_name=table_name,
            index_name=index_name
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
