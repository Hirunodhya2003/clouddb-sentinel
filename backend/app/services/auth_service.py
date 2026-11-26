import os
from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.schemas.auth import LoginResponse

DUMMY_HASH = hash_password("unused-login-placeholder")


def authenticate(db: Session, email: str, password: str) -> LoginResponse | None:
    user = db.execute(
        text("""
            SELECT user_id, role_id, password_hash, is_active
            FROM users
            WHERE email = :email
        """),
        {"email": email},
    ).mappings().one_or_none()

    stored_hash = user["password_hash"] if user is not None else DUMMY_HASH
    password_matches = verify_password(password, stored_hash)

    if user is None or not password_matches or not user["is_active"]:
        return None

    permissions = db.execute(
        text("""
            SELECT p.permission_code
            FROM permissions AS p
            JOIN role_permissions AS rp ON rp.permission_id = p.permission_id
            WHERE rp.role_id = :role_id
            ORDER BY p.permission_code
        """),
        {"role_id": user["role_id"]},
    ).scalars().all()

    now = datetime.now(timezone.utc)
    access_token = jwt.encode(
        {
            "sub": str(user["user_id"]),
            "iat": now,
            "exp": now + timedelta(minutes=30),
        },
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )

    return LoginResponse(
        access_token=access_token,
        permissions=list(permissions),
    )