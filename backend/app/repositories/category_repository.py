# Owner: Member 02
from typing import List, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product


class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, search: Optional[str] = None, status: Optional[str] = None) -> List[Category]:
        stmt = select(Category).order_by(Category.category_name)
        if status:
            stmt = stmt.where(Category.status == status)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(Category.category_name.ilike(like), Category.description.ilike(like)))
        return list(self.db.scalars(stmt).all())

    def get(self, category_id: int) -> Optional[Category]:
        return self.db.get(Category, category_id)

    def get_by_name(self, name: str, exclude_id: Optional[int] = None) -> Optional[Category]:
        stmt = select(Category).where(func.lower(Category.category_name) == name.lower())
        if exclude_id is not None:
            stmt = stmt.where(Category.category_id != exclude_id)
        return self.db.scalars(stmt).first()

    def count_products(self, category_id: int) -> int:
        return self.db.scalar(select(func.count(Product.product_id)).where(Product.category_id == category_id)) or 0

    def add(self, category: Category) -> Category:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def save(self, category: Category) -> Category:
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete(self, category: Category) -> None:
        self.db.delete(category)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
