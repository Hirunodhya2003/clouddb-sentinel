from collections.abc import Iterator

from sqlalchemy.orm import Session, sessionmaker

from .connection import engine

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session