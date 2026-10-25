from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.timeutil import now_utc

STATUS_OPEN = "open"
STATUS_CLOSED = "closed"


class Opportunity(Base):
    """Toque o presentación publicada por un establecimiento."""

    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(primary_key=True)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    genre: Mapped[str] = mapped_column(String(80))
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)  # hora local de Bogotá
    duration_minutes: Mapped[int] = mapped_column(Integer, default=90)
    pay_amount: Mapped[int] = mapped_column(Integer)  # COP
    pay_unit: Mapped[str] = mapped_column(String(10), default="toque")  # "toque" | "hora"
    image_url: Mapped[str | None] = mapped_column(String(500), default=None)
    includes: Mapped[list] = mapped_column(JSON, default=list)  # ["Sistema de sonido", ...]
    status: Mapped[str] = mapped_column(String(10), default=STATUS_OPEN, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
