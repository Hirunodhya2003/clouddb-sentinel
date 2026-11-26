# Owner: Member 02
from typing import List, Optional, Tuple

from sqlalchemy.exc import IntegrityError

from app.models.product import Product
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.service_errors import BadRequestError, ConflictError, NotFoundError


class ProductService:
    def __init__(self, repo: ProductRepository, categories: CategoryRepository):
        self.repo = repo
        self.categories = categories

    def list(self, **filters) -> Tuple[List[Product], int]:
        return self.repo.list(**filters)

    def get(self, product_id: int) -> Product:
        product = self.repo.get(product_id)
        if not product:
            raise NotFoundError("Product not found.")
        return product

    def _check_category(self, category_id: int) -> None:
        if not self.categories.get(category_id):
            raise BadRequestError("The selected category does not exist.")

    def create(self, data: ProductCreate) -> Product:
        if self.repo.get_by_code(data.product_code):
            raise ConflictError(f'Product code "{data.product_code}" is already in use.')
        self._check_category(data.category_id)
        try:
            return self.repo.add(Product(**data.model_dump()))
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError("This product conflicts with an existing record.")

    def update(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get(product_id)
        changes = data.model_dump(exclude_unset=True)
        code = changes.get("product_code")
        if code and self.repo.get_by_code(code, exclude_id=product_id):
            raise ConflictError(f'Product code "{code}" is already in use.')
        if "category_id" in changes and changes["category_id"] is not None:
            self._check_category(changes["category_id"])
        for field, value in changes.items():
            setattr(product, field, value)
        try:
            return self.repo.save(product)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError("This product conflicts with an existing record.")

    def delete(self, product_id: int) -> None:
        product = self.get(product_id)
        try:
            self.repo.delete(product)
        except IntegrityError:
            self.repo.rollback()
            raise ConflictError("This product is used by other records (variants, purchases or sales). Set it to inactive instead.")
