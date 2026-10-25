from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.applications import service
from app.modules.applications.models import STATUS_WITHDRAWN, Application
from app.modules.applications.schemas import ApplicationIn, ApplicationOut, ApplicationStatusIn
from app.modules.auth.deps import require_role
from app.modules.opportunities.service import get_owned_opportunity
from app.modules.users.models import ROLE_ARTIST, ROLE_VENUE, User

router = APIRouter(tags=["postulaciones"])


@router.post("/opportunities/{opportunity_id}/applications", response_model=ApplicationOut, status_code=201)
def apply_to_opportunity(
    opportunity_id: int,
    body: ApplicationIn | None = None,
    user: User = Depends(require_role(ROLE_ARTIST)),
    db: Session = Depends(get_db),
):
    """El artista envía su interés ("Quiero conectar")."""
    application = service.apply(db, user, opportunity_id, body.message if body else None)
    return service.to_artist_view(db, application)


@router.get("/applications/mine", response_model=list[ApplicationOut])
def my_applications(user: User = Depends(require_role(ROLE_ARTIST)), db: Session = Depends(get_db)):
    apps = db.scalars(
        select(Application).where(Application.artist_id == user.id).order_by(Application.created_at.desc())
    ).all()
    return [service.to_artist_view(db, a) for a in apps]


@router.delete("/applications/{application_id}", response_model=ApplicationOut)
def withdraw_application(
    application_id: int,
    user: User = Depends(require_role(ROLE_ARTIST)),
    db: Session = Depends(get_db),
):
    """El artista retira su interés."""
    application = db.get(Application, application_id)
    if not application or application.artist_id != user.id:
        raise HTTPException(404, "Postulación no encontrada")
    application.status = STATUS_WITHDRAWN
    db.commit()
    return service.to_artist_view(db, application)


@router.get("/opportunities/{opportunity_id}/applications", response_model=list[ApplicationOut])
def list_applications_for_opportunity(
    opportunity_id: int,
    user: User = Depends(require_role(ROLE_VENUE)),
    db: Session = Depends(get_db),
):
    """El establecimiento ve quién está interesado en su oportunidad."""
    get_owned_opportunity(db, opportunity_id, user)
    apps = db.scalars(
        select(Application)
        .where(Application.opportunity_id == opportunity_id, Application.status != STATUS_WITHDRAWN)
        .order_by(Application.created_at)
    ).all()
    return [service.to_venue_view(db, a) for a in apps]


@router.patch("/applications/{application_id}", response_model=ApplicationOut)
def decide_application(
    application_id: int,
    body: ApplicationStatusIn,
    user: User = Depends(require_role(ROLE_VENUE)),
    db: Session = Depends(get_db),
):
    """El establecimiento acepta o rechaza; al aceptar se revela el contacto del artista."""
    application = db.get(Application, application_id)
    if not application:
        raise HTTPException(404, "Postulación no encontrada")
    get_owned_opportunity(db, application.opportunity_id, user)
    if application.status == STATUS_WITHDRAWN:
        raise HTTPException(409, "El artista retiró su interés")
    application.status = body.status
    db.commit()
    return service.to_venue_view(db, application)
