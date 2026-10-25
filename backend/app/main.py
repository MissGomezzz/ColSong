"""ColSong API — monolito modular.

Cada carpeta de `app/modules/` es un módulo de dominio con sus propios modelos,
esquemas, servicio y router. Reglas de convivencia:

* Un módulo puede importar `models` y `service` de otro, nunca su `router`.
* Los modelos no definen `relationship()` entre módulos (solo claves foráneas),
  para que ningún módulo quede acoplado al código interno de otro.
* Dependencias permitidas (flechas = "depende de"):
  auth -> users, artists | artists -> users | venues -> users
  opportunities -> venues, applications, favorites (solo modelos, para lecturas)
  applications -> opportunities, artists, venues | favorites -> opportunities
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import Base, SessionLocal, engine
from app.modules.applications.router import router as applications_router
from app.modules.artists.router import router as artists_router
from app.modules.auth.router import router as auth_router
from app.modules.favorites.router import router as favorites_router
from app.modules.opportunities.router import router as opportunities_router
from app.modules.venues.router import router as venues_router
from app.seed import seed_demo_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)  # registra todas las tablas (los routers importan sus modelos)
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_demo_data(db)
    yield


app = FastAPI(
    title="ColSong API",
    description="Gestión de toques y presentaciones de establecimientos para artistas emergentes de Bogotá.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth_router,
    artists_router,
    venues_router,
    opportunities_router,
    applications_router,
    favorites_router,
):
    app.include_router(router, prefix="/api")


@app.get("/api/health", tags=["sistema"])
def health():
    return {"status": "ok"}
