from sqlalchemy.orm import Session

from app.repositories.size_repository import SizeRepository


class SizeService:

    @staticmethod
    def get_all_sizes(db: Session):
        return SizeRepository.get_all(db)

    @staticmethod
    def get_size_by_id(db: Session, size_id: int):
        size = SizeRepository.get_by_id(db, size_id)

        if not size:
            raise ValueError("Size not found")

        return size

