# Owner: Member 02
from typing import List

from app.repositories.schema_repository import SchemaRepository
from app.schemas.schema_viewer import RelationshipInfo, TableInfo


class SchemaViewerService:
    def __init__(self, repo: SchemaRepository):
        self.repo = repo

    def tables(self) -> List[TableInfo]:
        return [TableInfo(**row) for row in self.repo.list_tables()]

    def relationships(self) -> List[RelationshipInfo]:
        return [RelationshipInfo(**row) for row in self.repo.list_relationships()]
