# Owner: Member 02
from typing import List, Optional

from sqlalchemy.exc import IntegrityError

from app.models.category import Category
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.service_errors import ConflictError, NotFoundError


class CategoryService:
    def __init__(self, repo: CategoryRepository):
        self.repo = repo

    def list(self, search: Optional[str] = None, status: Optional[str] = None) -> List[Category]:
        return self.repo.list(search=search, status=status)

    def get(self, category_id: int) -> Category:
        category = self.repo.get(category_id)
        if not category:
            raise NotFoundError("Category not found.")
        return category

    def create(self, data: CategoryCreate) -> Category:
        if self.repo.get_by_name(data.category_name):
            raise ConflictError(f'A category named "{data.category_name}" already exists.')
        try:
            return self.repo.add(Category(**data.model_dump()))
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError("This category conflicts with an existing record.")

    def update(self, category_id: int, data: CategoryUpdate) -> Category:
        category = self.get(category_id)
        changes = data.model_dump(exclude_unset=True)
        name = changes.get("category_name")
        if name and self.repo.get_by_name(name, exclude_id=category_id):
            raise ConflictError(f'A category named "{name}" already exists.')
        for field, value in changes.items():
            setattr(category, field, value)
        try:
            return self.repo.save(category)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError("This category conflicts with an existing record.")

    def delete(self, category_id: int) -> None:
        category = self.get(category_id)
        in_use = self.repo.count_products(category_id)
        if in_use:
            raise ConflictError(
                f"This category still has {in_use} product(s). Move or delete them first, or set the category to inactive."
            )
        self.repo.delete(category)
