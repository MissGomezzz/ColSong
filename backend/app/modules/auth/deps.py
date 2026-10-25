"""Dependencias de autenticación reutilizables por todos los módulos."""

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_access_token
from app.modules.users.models import User

_bearer = HTTPBearer(auto_error=False)


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if creds is None:
        return None
    try:
        payload = decode_access_token(creds.credentials)
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(401, "Sesión inválida o expirada")
    if user is None:
        raise HTTPException(401, "Sesión inválida o expirada")
    return user


def get_current_user(user: User | None = Depends(get_optional_user)) -> User:
    if user is None:
        raise HTTPException(401, "Debes iniciar sesión")
    return user


def require_role(role: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role != role:
            raise HTTPException(403, "No tienes permisos para esta acción")
        return user

    return dependency
