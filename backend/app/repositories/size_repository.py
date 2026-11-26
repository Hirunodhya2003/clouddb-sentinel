from sqlalchemy.orm import Session

from app.models.size import Size


class SizeRepository:

    @staticmethod
    def get_all(db: Session):
        return (
            db.query(Size)
            .filter(Size.is_active == True)
            .order_by(Size.size_id.asc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, size_id: int):
        return (
            db.query(Size)
            .filter(
                Size.size_id == size_id,
                Size.is_active == True
            )
            .first()
        )
