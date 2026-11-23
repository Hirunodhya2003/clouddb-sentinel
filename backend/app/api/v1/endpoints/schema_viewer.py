# Owner: Member 02
# Register in router.py with:  api_router.include_router(schema_viewer.router)
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.repositories.schema_repository import SchemaRepository
from app.schemas.schema_viewer import RelationshipInfo, TableInfo
from app.services.schema_viewer_service import SchemaViewerService

router = APIRouter(prefix="/schema", tags=["Schema Viewer"])


def get_service(db: Session = Depends(get_db)) -> SchemaViewerService:
    return SchemaViewerService(SchemaRepository(db))


@router.get("/tables", response_model=List[TableInfo])
def list_tables(svc: SchemaViewerService = Depends(get_service)):
    return svc.tables()


@router.get("/relationships", response_model=List[RelationshipInfo])
def list_relationships(svc: SchemaViewerService = Depends(get_service)):
    return svc.relationships()
