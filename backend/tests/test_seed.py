"""Los datos de demostración se pueden repetir sin duplicar ni tocar cuentas existentes."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./unused-seed-test.db")

from sqlalchemy import create_engine, func, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import app.main  # noqa: E402,F401  (registra todos los modelos)
from app.core.db import Base  # noqa: E402
from app.modules.opportunities.models import Opportunity  # noqa: E402
from app.modules.users.models import ROLE_ARTIST, ROLE_VENUE, User  # noqa: E402
from app.seed import seed_demo_data  # noqa: E402


def _count(db, model, *where):
    return db.scalar(select(func.count()).select_from(model).where(*where))


def test_seed_is_complete_and_idempotent():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        seed_demo_data(db)
        seed_demo_data(db)  # repetir no duplica
        assert _count(db, User, User.role == ROLE_ARTIST) == 7
        assert _count(db, User, User.role == ROLE_VENUE) == 6
        assert _count(db, Opportunity) == 12


def test_seed_tops_up_an_existing_database_without_touching_it():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        seed_demo_data(db)
        db.query(Opportunity).filter(Opportunity.title == "Jueves de rock emergente").delete()
        sofia_hash = db.scalar(select(User.password_hash).where(User.email == "sofia@luna.com"))
        extra = db.scalar(select(User).where(User.email == "nebula@artistas.colsong.co"))
        db.delete(extra)  # simula una base creada antes de añadir estos perfiles
        db.commit()
        seed_demo_data(db)
        assert _count(db, User, User.email == "nebula@artistas.colsong.co") == 1
        assert _count(db, Opportunity, Opportunity.title == "Jueves de rock emergente") == 0
        assert db.scalar(select(User.password_hash).where(User.email == "sofia@luna.com")) == sofia_hash
