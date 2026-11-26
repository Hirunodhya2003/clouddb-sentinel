
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.size import SizeResponse
from app.services.size_service import SizeService


router = APIRouter(prefix="/sizes", tags=["Product Sizes"])


@router.get("/", response_model=list[SizeResponse])
def get_all_sizes(db: Session = Depends(get_db)):
    return SizeService.get_all_sizes(db)


@router.get("/{size_id}", response_model=SizeResponse)
def get_size(size_id: int, db: Session = Depends(get_db)):
    try:
        return SizeService.get_size_by_id(db, size_id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )
