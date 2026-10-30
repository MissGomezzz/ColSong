"""Motor y sesión de SQLAlchemy compartidos por todos los módulos."""

from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

if _is_sqlite:
    engine = create_engine(settings.database_url, connect_args={"check_same_thread": False})
else:
    # Servicios como Neon suspenden el cómputo tras ~5 min sin uso y cierran las conexiones
    # inactivas: pre_ping detecta una conexión muerta antes de usarla y recycle evita
    # reutilizar conexiones más viejas que ese plazo.
    engine = create_engine(settings.database_url, pool_pre_ping=True, pool_recycle=240)

if _is_sqlite:

    @event.listens_for(engine, "connect")
    def _enable_sqlite_fks(dbapi_connection, _record):  # pragma: no cover
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
