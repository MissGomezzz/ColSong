from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.deps import require_role
from app.modules.users.models import ROLE_VENUE, User
from app.modules.venues.models import Venue
from app.modules.venues.schemas import VenueIn, VenueOut, VenueUpdate

router = APIRouter(prefix="/venues", tags=["establecimientos"])

# Campos que el establecimiento puede dejar vacíos; el resto ignora `null`.
NULLABLE_FIELDS = {"description", "phone", "image_url", "latitude", "longitude"}


@router.post("", response_model=VenueOut, status_code=201)
def create_venue(
    body: VenueIn,
    user: User = Depends(require_role(ROLE_VENUE)),
    db: Session = Depends(get_db),
):
    venue = Venue(owner_id=user.id, **body.model_dump())
    db.add(venue)
    db.commit()
    return venue


@router.get("/mine", response_model=list[VenueOut])
def my_venues(user: User = Depends(require_role(ROLE_VENUE)), db: Session = Depends(get_db)):
    return db.scalars(select(Venue).where(Venue.owner_id == user.id).order_by(Venue.id)).all()


@router.put("/{venue_id}", response_model=VenueOut)
def update_venue(
    venue_id: int,
    body: VenueUpdate,
    user: User = Depends(require_role(ROLE_VENUE)),
    db: Session = Depends(get_db),
):
    venue = db.get(Venue, venue_id)
    if not venue or venue.owner_id != user.id:
        raise HTTPException(404, "Establecimiento no encontrado")
    for key, value in body.model_dump(exclude_unset=True).items():
        if value is None and key not in NULLABLE_FIELDS:
            continue
        setattr(venue, key, value)
    db.commit()
    return venue
