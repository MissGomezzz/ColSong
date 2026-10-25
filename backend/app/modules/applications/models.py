from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.timeutil import now_utc

STATUS_PENDING = "pending"
STATUS_ACCEPTED = "accepted"
STATUS_REJECTED = "rejected"
STATUS_WITHDRAWN = "withdrawn"
# Estados que cuentan como "artista interesado" en una oportunidad.
ACTIVE_STATUSES = (STATUS_PENDING, STATUS_ACCEPTED)


class Application(Base):
    """Interés de un artista en una oportunidad ("Quiero conectar")."""

    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("opportunity_id", "artist_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    opportunity_id: Mapped[int] = mapped_column(ForeignKey("opportunities.id", ondelete="CASCADE"), index=True)
    artist_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    message: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[str] = mapped_column(String(10), default=STATUS_PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now_utc, onupdate=now_utc)
