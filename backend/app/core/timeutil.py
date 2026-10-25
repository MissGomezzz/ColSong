"""Fechas.

ColSong opera solo en Bogotá (UTC-5, sin horario de verano), así que los horarios de
los eventos (`starts_at`) se guardan como hora local de Bogotá, sin zona horaria.
"""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

BOGOTA = ZoneInfo("America/Bogota")


def now_bogota() -> datetime:
    return datetime.now(BOGOTA).replace(tzinfo=None)


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
