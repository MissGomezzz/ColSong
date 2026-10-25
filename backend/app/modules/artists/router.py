from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.artists import service
from app.modules.artists.models import ArtistProfile
from app.modules.artists.schemas import ArtistProfileIn, ArtistProfileOut
from app.modules.auth.deps import require_role
from app.modules.users.models import ROLE_ARTIST, User

router = APIRouter(prefix="/artists", tags=["artistas"])


def _own_profile(db: Session, user: User) -> ArtistProfile:
    profile = db.get(ArtistProfile, user.id)
    if not profile:
        raise HTTPException(404, "Perfil artístico no encontrado")
    return profile


@router.get("/me", response_model=ArtistProfileOut)
def get_my_profile(user: User = Depends(require_role(ROLE_ARTIST)), db: Session = Depends(get_db)):
    return service.to_out(_own_profile(db, user))


@router.put("/me", response_model=ArtistProfileOut)
def update_my_profile(
    body: ArtistProfileIn,
    user: User = Depends(require_role(ROLE_ARTIST)),
    db: Session = Depends(get_db),
):
    profile = _own_profile(db, user)
    for key, value in body.model_dump(exclude_unset=True).items():
        if key in ("stage_name", "city") and value is None:
            continue
        setattr(profile, key, value)
    db.commit()
    return service.to_out(profile)
