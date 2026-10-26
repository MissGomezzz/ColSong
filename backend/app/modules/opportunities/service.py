"""Consulta y publicación de oportunidades.

Este módulo es el "agregador" de lectura: compone venue + conteo de interesados +
favoritos + estado de postulación usando solo las tablas (modelos) de otros módulos,
nunca sus routers.
"""

from datetime import date, datetime, time, timedelta
from math import asin, cos, radians, sin, sqrt

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.timeutil import now_bogota
from app.modules.applications.models import ACTIVE_STATUSES, STATUS_ACCEPTED, STATUS_PENDING, Application
from app.modules.favorites.models import Favorite
from app.modules.opportunities.models import STATUS_OPEN, Opportunity
from app.modules.opportunities.schemas import OpportunityOut, VenueSummary
from app.modules.users.models import User
from app.modules.venues.models import Venue

NIGHT_STARTS_AT_HOUR = 19  # coincide con el filtro "Desde las 7 p. m." del frontend


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * 6371 * asin(sqrt(a))


def list_opportunities(
    db: Session,
    user: User | None = None,
    *,
    opportunity_id: int | None = None,
    owner_id: int | None = None,
    favorites_only: bool = False,
    q: str | None = None,
    neighborhood: str | None = None,
    genre: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    period: str | None = None,  # "afternoon" | "night"
    lat: float | None = None,
    lng: float | None = None,
) -> list[OpportunityOut]:
    stmt = select(Opportunity, Venue).join(Venue, Venue.id == Opportunity.venue_id)

    if opportunity_id is not None:
        stmt = stmt.where(Opportunity.id == opportunity_id)
    elif owner_id is not None:
        stmt = stmt.where(Venue.owner_id == owner_id)  # panel del establecimiento: todo, incluso pasado
    else:
        stmt = stmt.where(Opportunity.status == STATUS_OPEN, Opportunity.starts_at >= now_bogota())

    if favorites_only and user:
        stmt = stmt.join(
            Favorite,
            (Favorite.opportunity_id == Opportunity.id) & (Favorite.user_id == user.id),
        )
    if q and q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Opportunity.title).like(like),
                func.lower(Opportunity.genre).like(like),
                func.lower(Venue.name).like(like),
                func.lower(Venue.venue_type).like(like),
                func.lower(Venue.neighborhood).like(like),
            )
        )
    if neighborhood:
        stmt = stmt.where(func.lower(Venue.neighborhood) == neighborhood.strip().lower())
    if genre:
        stmt = stmt.where(func.lower(Opportunity.genre).like(f"%{genre.strip().lower()}%"))
    if date_from:
        stmt = stmt.where(Opportunity.starts_at >= datetime.combine(date_from, time.min))
    if date_to:
        stmt = stmt.where(Opportunity.starts_at < datetime.combine(date_to + timedelta(days=1), time.min))

    rows = db.execute(stmt.order_by(Opportunity.starts_at, Opportunity.id)).all()
    if period == "afternoon":
        rows = [r for r in rows if r[0].starts_at.hour < NIGHT_STARTS_AT_HOUR]
    elif period == "night":
        rows = [r for r in rows if r[0].starts_at.hour >= NIGHT_STARTS_AT_HOUR]
    if not rows:
        return []

    ids = [opp.id for opp, _ in rows]
    interested = dict(
        db.execute(
            select(Application.opportunity_id, func.count())
            .where(Application.opportunity_id.in_(ids), Application.status.in_(ACTIVE_STATUSES))
            .group_by(Application.opportunity_id)
        ).all()
    )
    pending = dict(
        db.execute(
            select(Application.opportunity_id, func.count())
            .where(Application.opportunity_id.in_(ids), Application.status == STATUS_PENDING)
            .group_by(Application.opportunity_id)
        ).all()
    )
    now = now_bogota()
    saved: set[int] = set()
    my_status: dict[int, str] = {}
    if user:
        saved = set(
            db.scalars(
                select(Favorite.opportunity_id).where(
                    Favorite.user_id == user.id, Favorite.opportunity_id.in_(ids)
                )
            )
        )
        my_status = dict(
            db.execute(
                select(Application.opportunity_id, Application.status).where(
                    Application.artist_id == user.id, Application.opportunity_id.in_(ids)
                )
            ).all()
        )

    results = []
    for opp, venue in rows:
        distance = None
        if None not in (lat, lng, venue.latitude, venue.longitude):
            distance = round(_distance_km(lat, lng, venue.latitude, venue.longitude), 1)
        results.append(
            OpportunityOut(
                id=opp.id,
                title=opp.title,
                description=opp.description,
                genre=opp.genre,
                starts_at=opp.starts_at,
                duration_minutes=opp.duration_minutes,
                pay_amount=opp.pay_amount,
                pay_unit=opp.pay_unit,
                image_url=opp.image_url or venue.image_url,
                includes=opp.includes or [],
                status=opp.status,
                venue=VenueSummary(
                    id=venue.id,
                    name=venue.name,
                    venue_type=venue.venue_type,
                    neighborhood=venue.neighborhood,
                    address=venue.address,
                    latitude=venue.latitude,
                    longitude=venue.longitude,
                    verified=venue.verified,
                    response_hours=venue.response_hours,
                    accent=venue.accent,
                ),
                distance_km=distance,
                interested_count=interested.get(opp.id, 0),
                saved=opp.id in saved,
                my_application_status=my_status.get(opp.id),
                own_image_url=opp.image_url,
                pending_count=pending.get(opp.id, 0),
                is_past=opp.starts_at < now,
                venue_phone=venue.phone if my_status.get(opp.id) == STATUS_ACCEPTED else None,
            )
        )
    if lat is not None and lng is not None and not opportunity_id:
        results.sort(key=lambda o: (o.starts_at, o.distance_km if o.distance_km is not None else 1e9))
    return results


def get_owned_opportunity(db: Session, opportunity_id: int, owner: User) -> Opportunity:
    """Oportunidad cuyo establecimiento pertenece a `owner`; 404 si no existe o no es suya."""
    row = db.execute(
        select(Opportunity, Venue.owner_id)
        .join(Venue, Venue.id == Opportunity.venue_id)
        .where(Opportunity.id == opportunity_id)
    ).first()
    if not row or row[1] != owner.id:
        raise HTTPException(404, "Oportunidad no encontrada")
    return row[0]
