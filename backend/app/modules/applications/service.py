from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.timeutil import now_bogota
from app.modules.applications.models import (
    STATUS_ACCEPTED,
    STATUS_PENDING,
    STATUS_WITHDRAWN,
    Application,
)
from app.modules.applications.schemas import ApplicationOut, ArtistSummary
from app.modules.artists.models import ArtistProfile
from app.modules.opportunities.models import STATUS_OPEN, Opportunity
from app.modules.users.models import User
from app.modules.venues.models import Venue


def apply(db: Session, artist: User, opportunity_id: int, message: str | None) -> Application:
    opp = db.get(Opportunity, opportunity_id)
    if not opp:
        raise HTTPException(404, "Oportunidad no encontrada")
    if opp.status != STATUS_OPEN or opp.starts_at < now_bogota():
        raise HTTPException(409, "Esta oportunidad ya no está disponible")

    existing = db.scalar(
        select(Application).where(
            Application.opportunity_id == opportunity_id, Application.artist_id == artist.id
        )
    )
    if existing:
        if existing.status != STATUS_WITHDRAWN:
            raise HTTPException(409, "Ya enviaste tu interés a esta oportunidad")
        existing.status, existing.message = STATUS_PENDING, message  # retomar una postulación retirada
        application = existing
    else:
        application = Application(opportunity_id=opportunity_id, artist_id=artist.id, message=message)
        db.add(application)
    db.commit()
    return application


def to_artist_view(db: Session, app: Application) -> ApplicationOut:
    """Vista del artista: su postulación con datos de la oportunidad y el lugar."""
    opp = db.get(Opportunity, app.opportunity_id)
    venue = db.get(Venue, opp.venue_id)
    return ApplicationOut(
        id=app.id,
        opportunity_id=app.opportunity_id,
        status=app.status,
        message=app.message,
        created_at=app.created_at,
        opportunity_title=opp.title,
        venue_name=venue.name,
        starts_at=opp.starts_at,
    )


def to_venue_view(db: Session, app: Application) -> ApplicationOut:
    """Vista del establecimiento: perfil del artista; contacto solo si fue aceptado."""
    user = db.get(User, app.artist_id)
    profile = db.get(ArtistProfile, app.artist_id)
    accepted = app.status == STATUS_ACCEPTED
    artist = ArtistSummary(
        id=user.id,
        full_name=user.full_name,
        stage_name=profile.stage_name if profile else user.full_name,
        artist_type=profile.artist_type if profile else None,
        genres=(profile.genres if profile else []) or [],
        bio=profile.bio if profile else None,
        instagram=profile.instagram if profile else None,
        portfolio_url=profile.portfolio_url if profile else None,
        video_url=profile.video_url if profile else None,
        email=user.email if accepted else None,
        phone=(profile.phone if profile else None) if accepted else None,
    )
    return ApplicationOut(
        id=app.id,
        opportunity_id=app.opportunity_id,
        status=app.status,
        message=app.message,
        created_at=app.created_at,
        artist=artist,
    )
