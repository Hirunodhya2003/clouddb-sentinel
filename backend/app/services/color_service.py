from sqlalchemy.orm import Session

from app.repositories.color_repository import ColorRepository


class ColorService:

    @staticmethod
    def get_all_colours(db: Session):
        return ColorRepository.get_all(db)

    @staticmethod
    def get_colour_by_id(db: Session, colour_id: int):
        colour = ColorRepository.get_by_id(db, colour_id)

        if not colour:
            raise ValueError("Colour not found")

        return colour
