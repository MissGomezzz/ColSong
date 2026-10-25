"""Datos de demostración (solo si la base está vacía y SEED_DEMO=true)."""

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.core.timeutil import now_bogota
from app.modules.artists.models import ArtistProfile
from app.modules.opportunities.models import Opportunity
from app.modules.users.models import ROLE_ARTIST, ROLE_VENUE, User
from app.modules.venues.models import Venue

DEMO_PASSWORD = "colsong123"
DESCRIPTION = (
    "Buscamos un proyecto musical con identidad propia para acompañar una noche especial. "
    "El espacio cuenta con sonido profesional y una audiencia cercana que disfruta descubrir "
    "propuestas emergentes.\n\n"
    "El repertorio debe tener una duración aproximada de 90 minutos, con un breve intermedio. "
    "Puedes interpretar música original y versiones."
)
INCLUDES = ["Sistema de sonido", "Prueba de sonido", "Bebidas y cena", "Parqueadero"]
IMG = "https://images.unsplash.com/{}?auto=format&fit=crop&w=1200&q=85"


def _next_weekday(weekday: int, hour: int, minute: int = 0, weeks_ahead: int = 0) -> datetime:
    """Próxima ocurrencia (estrictamente futura) de un día de la semana (lunes=0)."""
    today = now_bogota().replace(hour=0, minute=0, second=0, microsecond=0)
    days = (weekday - today.weekday()) % 7 or 7
    return today + timedelta(days=days + 7 * weeks_ahead, hours=hour, minutes=minute)


def seed_demo_data(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)) is not None:
        return

    pwd = hash_password(DEMO_PASSWORD)
    sofia = User(email="sofia@luna.com", password_hash=pwd, role=ROLE_ARTIST, full_name="Sofía Luna")
    owners = [
        User(email=f"{slug}@colsong.co", password_hash=pwd, role=ROLE_VENUE, full_name=name)
        for slug, name in (
            ("casafrida", "Casa Frida Bogotá"),
            ("cafedelparque", "Café del Parque"),
            ("distrito47", "Distrito 47"),
        )
    ]
    db.add_all([sofia, *owners])
    db.flush()

    db.add(
        ArtistProfile(
            user_id=sofia.id,
            stage_name="Sofía Luna",
            artist_type="Cantautora",
            bio="Cantautora bogotana de folk e indie con dos EPs publicados.",
            genres=["Folk", "Indie"],
            phone="+57 300 000 0000",
            instagram="@sofialuna.music",
            portfolio_url="https://sofialuna.example.com",
            video_url=None,  # falta el video: el perfil queda en 88 %
        )
    )

    casa, cafe, distrito = (
        Venue(owner_id=owners[0].id, name="Casa Frida", venue_type="Bar cultural", neighborhood="Chapinero",
              address="Cra. 13 #54-20, Chapinero", latitude=4.6486, longitude=-74.0628, accent="purple",
              verified=True, response_hours=2, phone="+57 601 000 0001", image_url=IMG.format("photo-1514320291840-2e0a9bf2a9ae")),
        Venue(owner_id=owners[1].id, name="Café del Parque", venue_type="Café & terraza", neighborhood="La Macarena",
              address="Cl. 27 #5-30, La Macarena", latitude=4.6120, longitude=-74.0645, accent="orange",
              verified=True, response_hours=4, phone="+57 601 000 0002", image_url=IMG.format("photo-1471478331149-c72f17e33c73")),
        Venue(owner_id=owners[2].id, name="Distrito 47", venue_type="Club", neighborhood="Teusaquillo",
              address="Cl. 45 #19-12, Teusaquillo", latitude=4.6373, longitude=-74.0745, accent="blue",
              verified=False, response_hours=24, phone="+57 601 000 0003", image_url=IMG.format("photo-1541804627596-3b5b9ef58c93")),
    )
    db.add_all([casa, cafe, distrito])
    db.flush()

    def opp(venue, title, genre, when, amount, unit, minutes=90, image=None):
        return Opportunity(
            venue_id=venue.id, title=title, description=DESCRIPTION, genre=genre, starts_at=when,
            duration_minutes=minutes, pay_amount=amount, pay_unit=unit, includes=INCLUDES, image_url=image,
        )

    db.add_all(
        [
            opp(casa, "Noche de indie & alternativo", "Indie / Alternativo", _next_weekday(4, 20), 450_000, "toque"),
            opp(cafe, "Acústico al atardecer", "Acústico / Folk", _next_weekday(5, 17, 30), 180_000, "hora", 120),
            opp(distrito, "Sesión de jazz en vivo", "Jazz / Soul", _next_weekday(6, 19), 520_000, "toque"),
            opp(casa, "Jueves de rock emergente", "Rock", _next_weekday(3, 20, 30, 1), 380_000, "toque"),
            opp(cafe, "Tarde de trova y bossa", "Trova / Bossa nova", _next_weekday(5, 16, 0, 1), 150_000, "hora", 120),
            opp(distrito, "Noche de electrónica en vivo", "Electrónica", _next_weekday(4, 22, 0, 1), 600_000, "toque", 120),
        ]
    )
    db.commit()
