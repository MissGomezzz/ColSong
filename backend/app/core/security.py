"""Hash de contraseñas (scrypt, librería estándar) y tokens JWT."""

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings

_N, _R, _P = 2**14, 8, 1


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt_hex, digest_hex = stored.split("$")
        digest = hashlib.scrypt(
            password.encode(), salt=bytes.fromhex(salt_hex), n=_N, r=_R, p=_P
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: int, role: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": exp},
        settings.jwt_secret,
        algorithm="HS256",
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
