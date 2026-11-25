
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.color import ColorResponse
from app.services.color_service import ColorService


router = APIRouter(prefix="/colors", tags=["Product Colours"])


@router.get("/", response_model=list[ColorResponse])
def get_all_colours(db: Session = Depends(get_db)):
    return ColorService.get_all_colours(db)


@router.get("/{colour_id}", response_model=ColorResponse)
def get_colour(colour_id: int, db: Session = Depends(get_db)):
    try:
        return ColorService.get_colour_by_id(db, colour_id)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )
