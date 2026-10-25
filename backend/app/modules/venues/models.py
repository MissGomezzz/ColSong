from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    venue_type: Mapped[str] = mapped_column(String(80))  # "Bar cultural", "Club", ...
    description: Mapped[str | None] = mapped_column(Text, default=None)
    neighborhood: Mapped[str] = mapped_column(String(80), index=True)  # "Chapinero"
    address: Mapped[str] = mapped_column(String(200))
    latitude: Mapped[float | None] = mapped_column(Float, default=None)
    longitude: Mapped[float | None] = mapped_column(Float, default=None)
    phone: Mapped[str | None] = mapped_column(String(40), default=None)
    image_url: Mapped[str | None] = mapped_column(String(500), default=None)
    accent: Mapped[str] = mapped_column(String(10), default="purple")  # purple | orange | blue
    # La verificación de identidad la hace el equipo de ColSong (proceso de negocio manual).
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    response_hours: Mapped[int] = mapped_column(Integer, default=24)  # tiempo típico de respuesta
