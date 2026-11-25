from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth_service import authenticate

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    result = authenticate(db, str(payload.email), payload.password)

    if result is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return result