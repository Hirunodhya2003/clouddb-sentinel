
# Owner: Member 03
# Service: Product Variants

from sqlalchemy.orm import Session

from app.repositories.variant_repository import VariantRepository
from app.schemas.variant import VariantCreate, VariantUpdate


class VariantService:

    @staticmethod
    def get_all_variants(db: Session):
        return VariantRepository.get_all(db)

    @staticmethod
    def get_variant_by_id(db: Session, variant_id: int):
        variant = VariantRepository.get_by_id(db, variant_id)

        if not variant:
            raise ValueError("Variant not found")

        return variant

    @staticmethod
    def create_variant(db: Session, variant_data: VariantCreate):
        data = variant_data.model_dump()

        existing_sku = VariantRepository.get_by_sku(
            db,
            data["sku"]
        )

        if existing_sku:
            raise ValueError("A variant with this SKU already exists")

        return VariantRepository.create(db, data)

    @staticmethod
    def update_variant(
        db: Session,
        variant_id: int,
        update_data: VariantUpdate
    ):
        variant = VariantService.get_variant_by_id(db, variant_id)

        data = update_data.model_dump(exclude_unset=True)

        if "sku" in data:
            existing_sku = VariantRepository.get_by_sku(
                db,
                data["sku"]
            )

            if existing_sku and existing_sku.variant_id != variant_id:
                raise ValueError("A variant with this SKU already exists")

        return VariantRepository.update(db, variant, data)

    @staticmethod
    def delete_variant(db: Session, variant_id: int):
        variant = VariantService.get_variant_by_id(db, variant_id)

        return VariantRepository.delete(db, variant)
