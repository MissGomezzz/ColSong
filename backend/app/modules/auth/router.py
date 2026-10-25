from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.artists import service as artists_service
from app.modules.auth.deps import get_current_user
from app.modules.auth.schemas import LoginIn, RegisterIn, TokenOut, UserOut
from app.modules.users.models import ROLE_ARTIST, User

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id, user.role),
        user=UserOut.model_validate(user),
    )


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Ya existe una cuenta con ese correo")
    user = User(
        email=email,
        password_hash=hash_password(body.password),
        role=body.role,
        full_name=body.full_name.strip(),
    )
    db.add(user)
    db.flush()
    if user.role == ROLE_ARTIST:
        artists_service.create_empty_profile(db, user.id, user.full_name)
    db.commit()
    return _token_response(user)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Correo o contraseña incorrectos")
    return _token_response(user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
