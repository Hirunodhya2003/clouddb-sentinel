from sqlalchemy.orm import Session

from app.models.color import Color


class ColorRepository:

    @staticmethod
    def get_all(db: Session):
        return (
            db.query(Color)
            .filter(Color.is_active == True)
            .order_by(Color.colour_id.asc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, colour_id: int):
        return (
            db.query(Color)
            .filter(
                Color.colour_id == colour_id,
                Color.is_active == True
            )
            .first()
        )
