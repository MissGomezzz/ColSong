"""Configuración centralizada, leída de variables de entorno (ver .env.example)."""

import os
from dataclasses import dataclass, field


def _load_dotenv() -> None:
    """Carga backend/.env si existe, sin dependencias externas."""
    path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()


def _origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:8443,http://localhost:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


def _database_url() -> str:
    """Normaliza URLs de PostgreSQL (p. ej. las de Neon o Render) al driver psycopg 3."""
    url = os.getenv("DATABASE_URL", "sqlite:///./colsong.db")
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


@dataclass(frozen=True)
class Settings:
    database_url: str = _database_url()
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-only-secret-change-me-in-production")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
    cors_origins: list[str] = field(default_factory=_origins)
    seed_demo: bool = os.getenv("SEED_DEMO", "true").lower() == "true"


settings = Settings()
