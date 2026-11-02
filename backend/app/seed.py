"""Datos de demostración (solo con SEED_DEMO=true; nunca duplica ni toca cuentas existentes)."""

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


# (correo, nombre, nombre artístico, tipo, géneros, biografía, teléfono, instagram, portafolio, video)
EXTRA_ARTISTS = [
    ("mapaches@artistas.colsong.co", "Julián Torres", "Los Mapaches del Sur", "Banda", ["Rock", "Indie / Alternativo"],
     "Cuarteto bogotano de rock alternativo con letras sobre la ciudad. Tres años tocando en bares y festivales locales.",
     "+57 310 000 0101", "@losmapachesdelsur", "https://mapaches.example.com", "https://youtu.be/demo-mapaches"),
    ("camila.rios@artistas.colsong.co", "Camila Ríos", "Camila Ríos Trío", "Trío de jazz", ["Jazz / Soul"],
     "Voz, piano y contrabajo. Standards reinterpretados y composiciones propias con aire de soul.",
     "+57 311 000 0102", "@camilariostrio", "https://camilarios.example.com", None),
    ("nebula@artistas.colsong.co", "Andrea Nieto", "DJ Nébula", "DJ / Productora", ["Electrónica"],
     "Sets de house y electrónica melódica con visuales en vivo. Disponible para sesiones de dos horas.",
     "+57 312 000 0103", "@djnebula.co", "https://nebula.example.com", "https://youtu.be/demo-nebula"),
    ("andres.pardo@artistas.colsong.co", "Andrés Pardo", "Andrés Pardo", "Trovador", ["Trova / Bossa nova", "Acústico / Folk"],
     "Guitarra y voz. Trova latinoamericana, bossa nova y canciones propias para espacios íntimos.",
     "+57 313 000 0104", "@andrespardo.trova", "https://andrespardo.example.com", None),
    ("cumbia@artistas.colsong.co", "Laura Mejía", "Cumbia Subterránea", "Orquesta", ["Salsa / Latino"],
     "Nueve músicos, cumbia y salsa para bailar. Repertorio de clásicos y arreglos propios.",
     "+57 314 000 0105", "@cumbiasubterranea", "https://cumbiasubterranea.example.com", "https://youtu.be/demo-cumbia"),
    ("veronica.salcedo@artistas.colsong.co", "Verónica Salcedo", "Verónica Salcedo", "Cantante", ["Pop", "Indie / Alternativo"],
     "Pop de autor con arreglos minimalistas. Primer sencillo publicado este año; busca sus primeras fechas en vivo.",
     "+57 315 000 0106", "@veronicasalcedo", None, None),
]

# (correo, nombre del dueño, local, tipo, barrio, dirección, lat, lng, color, verificado, respuesta h, teléfono, imagen, [toques])
# toque = (título, género, día de la semana (lunes=0), hora, minuto, semanas, pago, unidad, minutos)
EXTRA_VENUES = [
    ("cantinaquinta@colsong.co", "Mauricio Vela", "La Cantina de Quinta", "Bar", "Quinta Camacho",
     "Cl. 70 #9-15, Quinta Camacho", 4.656, -74.064, "orange", True, 3, "+57 601 000 0004",
     IMG.format("photo-1531971772042-d189c2021395"),
     [("Viernes de rock bogotano", "Rock", 4, 21, 0, 0, 400_000, "toque", 90),
      ("Noche de pop de autor", "Pop", 5, 20, 0, 1, 300_000, "toque", 90)]),
    ("teatrointimo@colsong.co", "Daniela Cruz", "Teatro Íntimo Candelaria", "Teatro", "La Candelaria",
     "Cl. 12 #2-40, La Candelaria", 4.5964, -74.0731, "purple", True, 6, "+57 601 000 0005",
     IMG.format("photo-1514320291840-2e0a9bf2a9ae"),
     [("Trova en sala íntima", "Trova / Bossa nova", 3, 19, 30, 0, 250_000, "toque", 75),
      ("Jazz de cámara", "Jazz / Soul", 6, 18, 0, 1, 450_000, "toque", 90)]),
    ("terrazausaquen@colsong.co", "Felipe Ortiz", "Terraza Usaquén", "Restaurante", "Usaquén",
     "Cra. 6A #119-30, Usaquén", 4.695, -74.03, "blue", False, 12, "+57 601 000 0006",
     IMG.format("photo-1471478331149-c72f17e33c73"),
     [("Cumbia y salsa en la terraza", "Salsa / Latino", 5, 21, 0, 0, 700_000, "toque", 120),
      ("Sesión electrónica al atardecer", "Electrónica", 6, 17, 0, 1, 200_000, "hora", 120)]),
]


def seed_demo_data(db: Session) -> None:
    """Crea las cuentas demo que falten. Es seguro repetirlo: lo existente no se modifica."""
    pwd = hash_password(DEMO_PASSWORD)
    exists = lambda email: db.scalar(select(User.id).where(User.email == email)) is not None  # noqa: E731

    def opp(venue, title, genre, when, amount, unit, minutes=90, image=None):
        return Opportunity(
            venue_id=venue.id, title=title, description=DESCRIPTION, genre=genre, starts_at=when,
            duration_minutes=minutes, pay_amount=amount, pay_unit=unit, includes=INCLUDES, image_url=image,
        )

    if not exists("sofia@luna.com"):
        sofia = User(email="sofia@luna.com", password_hash=pwd, role=ROLE_ARTIST, full_name="Sofía Luna")
        db.add(sofia)
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

    if not exists("casafrida@colsong.co"):
        owners = [
            User(email=f"{slug}@colsong.co", password_hash=pwd, role=ROLE_VENUE, full_name=name)
            for slug, name in (
                ("casafrida", "Casa Frida Bogotá"),
                ("cafedelparque", "Café del Parque"),
                ("distrito47", "Distrito 47"),
            )
        ]
        db.add_all(owners)
        db.flush()
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

    for email, name, stage, kind, genres, bio, phone, instagram, portfolio, video in EXTRA_ARTISTS:
        if exists(email):
            continue
        user = User(email=email, password_hash=pwd, role=ROLE_ARTIST, full_name=name)
        db.add(user)
        db.flush()
        db.add(
            ArtistProfile(
                user_id=user.id, stage_name=stage, artist_type=kind, bio=bio, genres=genres,
                phone=phone, instagram=instagram, portfolio_url=portfolio, video_url=video,
            )
        )

    for (email, owner, name, kind, hood, address, lat, lng, accent, verified, hours, phone, image, gigs) in EXTRA_VENUES:
        if exists(email):
            continue
        user = User(email=email, password_hash=pwd, role=ROLE_VENUE, full_name=owner)
        db.add(user)
        db.flush()
        venue = Venue(
            owner_id=user.id, name=name, venue_type=kind, neighborhood=hood, address=address,
            latitude=lat, longitude=lng, accent=accent, verified=verified, response_hours=hours,
            phone=phone, image_url=image,
        )
        db.add(venue)
        db.flush()
        for title, genre, weekday, hour, minute, weeks, amount, unit, minutes in gigs:
            db.add(opp(venue, title, genre, _next_weekday(weekday, hour, minute, weeks), amount, unit, minutes))

    db.commit()
