
# Owner: Member 03
# Repository: Product Variants

from sqlalchemy.orm import Session

from app.models.product_variant import ProductVariant


class VariantRepository:

    @staticmethod
    def get_all(db: Session):
        return (
            db.query(ProductVariant)
            .order_by(ProductVariant.variant_id.desc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, variant_id: int):
        return (
            db.query(ProductVariant)
            .filter(ProductVariant.variant_id == variant_id)
            .first()
        )

    @staticmethod
    def get_by_sku(db: Session, sku: str):
        return (
            db.query(ProductVariant)
            .filter(ProductVariant.sku == sku)
            .first()
        )

    @staticmethod
    def create(db: Session, variant_data: dict):
        variant = ProductVariant(**variant_data)

        db.add(variant)
        db.commit()
        db.refresh(variant)

        return variant

    @staticmethod
    def update(
        db: Session,
        variant: ProductVariant,
        update_data: dict
    ):
        for key, value in update_data.items():
            setattr(variant, key, value)

        db.commit()
        db.refresh(variant)

        return variant

    @staticmethod
    def delete(db: Session, variant: ProductVariant):
        db.delete(variant)
        db.commit()

        return True
