# Owner: Member 02
from typing import List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[Product], int]:
        conditions = []
        if search:
            like = f"%{search}%"
            conditions.append(or_(Product.product_code.ilike(like), Product.product_name.ilike(like)))
        if category_id:
            conditions.append(Product.category_id == category_id)
        if status:
            conditions.append(Product.status == status)

        total = self.db.scalar(select(func.count(Product.product_id)).where(*conditions)) or 0
        rows = self.db.scalars(
            select(Product)
            .options(joinedload(Product.category))
            .where(*conditions)
            .order_by(Product.product_id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(rows), total

    def get(self, product_id: int) -> Optional[Product]:
        return self.db.get(Product, product_id)

    def get_by_code(self, code: str, exclude_id: Optional[int] = None) -> Optional[Product]:
        stmt = select(Product).where(func.lower(Product.product_code) == code.lower())
        if exclude_id is not None:
            stmt = stmt.where(Product.product_id != exclude_id)
        return self.db.scalars(stmt).first()

    def add(self, product: Product) -> Product:
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def save(self, product: Product) -> Product:
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
