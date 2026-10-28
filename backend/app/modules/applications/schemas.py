from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ApplicationIn(BaseModel):
    message: str | None = Field(None, max_length=1000)


class ApplicationStatusIn(BaseModel):
    status: Literal["accepted", "rejected"]


class ArtistSummary(BaseModel):
    id: int
    full_name: str
    stage_name: str
    artist_type: str | None
    genres: list[str]
    bio: str | None
    instagram: str | None
    portfolio_url: str | None
    video_url: str | None
    # Datos de contacto: solo se revelan cuando el establecimiento acepta.
    email: str | None = None
    phone: str | None = None


class VenueContact(BaseModel):
    """Datos del local que el artista recibe solo cuando el local lo acepta."""

    address: str
    phone: str | None = None


class ApplicationOut(BaseModel):
    id: int
    opportunity_id: int
    status: str
    message: str | None
    created_at: datetime
    opportunity_title: str | None = None
    venue_name: str | None = None
    venue_neighborhood: str | None = None
    venue_contact: VenueContact | None = None  # solo si el local aceptó
    starts_at: datetime | None = None
    artist: ArtistSummary | None = None  # solo en la vista del establecimiento
