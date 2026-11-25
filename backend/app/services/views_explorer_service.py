
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.views_explorer import (
    ProductSummarySchema,
    VariantDetailsSchema
)


class ViewsExplorerService:

    @staticmethod
    def get_product_summary(db: Session):
        query = text("""
            SELECT *
            FROM product_view
            ORDER BY product_id DESC
        """)

        result = db.execute(query).mappings().all()

        return [
            ProductSummarySchema.model_validate(dict(row))
            for row in result
        ]

    @staticmethod
    def get_variant_details(db: Session):
        query = text("""
            SELECT *
            FROM variant_details_view
            ORDER BY variant_id DESC
        """)

        result = db.execute(query).mappings().all()

        return [
            VariantDetailsSchema.model_validate(dict(row))
            for row in result
        ]

    @staticmethod
    def get_product_summary_by_id(
        db: Session,
        product_id: int
    ):
        query = text("""
            SELECT *
            FROM product_view
            WHERE product_id = :product_id
        """)

        result = db.execute(
            query,
            {"product_id": product_id}
        ).mappings().first()

        if not result:
            return None

        return ProductSummarySchema.model_validate(dict(result))

    @staticmethod
    def get_variant_details_by_id(
        db: Session,
        variant_id: int
    ):
        query = text("""
            SELECT *
            FROM variant_details_view
            WHERE variant_id = :variant_id
        """)

        result = db.execute(
            query,
            {"variant_id": variant_id}
        ).mappings().first()

        if not result:
            return None

        return VariantDetailsSchema.model_validate(dict(result))
