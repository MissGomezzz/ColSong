from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.timeutil import now_bogota
from app.modules.auth.deps import get_optional_user, require_role
from app.modules.opportunities import service
from app.modules.opportunities.models import Opportunity
from app.modules.opportunities.schemas import OpportunityIn, OpportunityOut, OpportunityUpdate
from app.modules.users.models import ROLE_VENUE, User
from app.modules.venues.models import Venue

router = APIRouter(prefix="/opportunities", tags=["oportunidades"])

NULLABLE_FIELDS = {"description", "image_url"}  # el resto ignora `null`


@router.get("", response_model=list[OpportunityOut])
def list_open_opportunities(
    q: str | None = Query(None, description="Busca por lugar, evento, género, tipo o barrio"),
    neighborhood: str | None = None,
    genre: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    period: Literal["afternoon", "night"] | None = Query(None, description="afternoon: antes de las 7 p. m."),
    lat: float | None = Query(None, ge=-90, le=90),
    lng: float | None = Query(None, ge=-180, le=180),
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Oportunidades abiertas y futuras. Con sesión incluye `saved` y `my_application_status`."""
    return service.list_opportunities(
        db, user, q=q, neighborhood=neighborhood, genre=genre,
        date_from=date_from, date_to=date_to, period=period, lat=lat, lng=lng,
    )


@router.get("/mine", response_model=list[OpportunityOut])
def my_opportunities(user: User = Depends(require_role(ROLE_VENUE)), db: Session = Depends(get_db)):
    """Panel del establecimiento: todas sus oportunidades (abiertas, cerradas y pasadas)."""
    return service.list_opportunities(db, user, owner_id=user.id)


@router.get("/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(
    opportunity_id: int,
    lat: float | None = Query(None, ge=-90, le=90),
    lng: float | None = Query(None, ge=-180, le=180),
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    found = service.list_opportunities(db, user, opportunity_id=opportunity_id, lat=lat, lng=lng)
    if not found:
        raise HTTPException(404, "Oportunidad no encontrada")
    return found[0]


@router.post("", response_model=OpportunityOut, status_code=201)
def create_opportunity(
    body: OpportunityIn,
    user: User = Depends(require_role(ROLE_VENUE)),
    db: Session = Depends(get_db),
):
    venue = db.get(Venue, body.venue_id)
    if not venue or venue.owner_id != user.id:
        raise HTTPException(404, "Establecimiento no encontrado")
    if body.starts_at.replace(tzinfo=None) <= now_bogota():
        raise HTTPException(422, "La fecha del evento debe ser futura")
    data = body.model_dump()
    data["starts_at"] = body.starts_at.replace(tzinfo=None)
    opp = Opportunity(**data)
    db.add(opp)
    db.commit()
    return service.list_opportunities(db, user, opportunity_id=opp.id)[0]


@router.patch("/{opportunity_id}", response_model=OpportunityOut)
def update_opportunity(
    opportunity_id: int,
    body: OpportunityUpdate,
    user: User = Depends(require_role(ROLE_VENUE)),
    db: Session = Depends(get_db),
):
    """Edita una oportunidad o la cierra (`"status": "closed"`)."""
    opp = service.get_owned_opportunity(db, opportunity_id, user)
    changes = body.model_dump(exclude_unset=True)
    if "starts_at" in changes and changes["starts_at"] is not None:
        changes["starts_at"] = changes["starts_at"].replace(tzinfo=None)
        if changes["starts_at"] <= now_bogota():
            raise HTTPException(422, "La fecha del evento debe ser futura")
    if changes.get("status") == "open" and changes.get("starts_at", opp.starts_at) <= now_bogota():
        raise HTTPException(422, "No puedes reabrir una publicación cuya fecha ya pasó; cambia la fecha primero")
    for key, value in changes.items():
        if value is None and key not in NULLABLE_FIELDS:
            continue
        setattr(opp, key, value)
    db.commit()
    return service.list_opportunities(db, user, opportunity_id=opp.id)[0]


@router.delete("/{opportunity_id}", status_code=204)
def delete_opportunity(
    opportunity_id: int,
    user: User = Depends(require_role(ROLE_VENUE)),
    db: Session = Depends(get_db),
):
    """Elimina la publicación junto con sus postulaciones y favoritos (borrado en cascada)."""
    opp = service.get_owned_opportunity(db, opportunity_id, user)
    db.delete(opp)
    db.commit()
