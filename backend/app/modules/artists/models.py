from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ArtistProfile(Base):
    __tablename__ = "artist_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    stage_name: Mapped[str] = mapped_column(String(120))
    artist_type: Mapped[str | None] = mapped_column(String(80), default=None)  # p. ej. "Cantautora", "Banda"
    bio: Mapped[str | None] = mapped_column(Text, default=None)
    genres: Mapped[list] = mapped_column(JSON, default=list)
    city: Mapped[str] = mapped_column(String(80), default="Bogotá")
    phone: Mapped[str | None] = mapped_column(String(40), default=None)
    instagram: Mapped[str | None] = mapped_column(String(120), default=None)
    portfolio_url: Mapped[str | None] = mapped_column(String(300), default=None)
    video_url: Mapped[str | None] = mapped_column(String(300), default=None)
