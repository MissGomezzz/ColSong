from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class OpportunityIn(BaseModel):
    venue_id: int
    title: str = Field(min_length=3, max_length=160)
    description: str | None = Field(None, max_length=4000)
    genre: str = Field(min_length=2, max_length=80)
    starts_at: datetime  # hora local de Bogotá, p. ej. "2026-11-06T20:00:00"
    duration_minutes: int = Field(90, ge=15, le=600)
    pay_amount: int = Field(gt=0, le=100_000_000)
    pay_unit: Literal["toque", "hora"] = "toque"
    image_url: str | None = Field(None, max_length=500)
    includes: list[str] = Field(default_factory=list, max_length=20)


class OpportunityUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=160)
    description: str | None = Field(None, max_length=4000)
    genre: str | None = Field(None, min_length=2, max_length=80)
    starts_at: datetime | None = None
    duration_minutes: int | None = Field(None, ge=15, le=600)
    pay_amount: int | None = Field(None, gt=0, le=100_000_000)
    pay_unit: Literal["toque", "hora"] | None = None
    image_url: str | None = Field(None, max_length=500)
    includes: list[str] | None = Field(None, max_length=20)
    status: Literal["open", "closed"] | None = None


class VenueSummary(BaseModel):
    id: int
    name: str
    venue_type: str
    neighborhood: str
    address: str
    latitude: float | None
    longitude: float | None
    verified: bool
    response_hours: int
    accent: str


class OpportunityOut(BaseModel):
    id: int
    title: str
    description: str | None
    genre: str
    starts_at: datetime
    duration_minutes: int
    pay_amount: int
    pay_unit: str
    image_url: str | None
    includes: list[str]
    status: str
    venue: VenueSummary
    distance_km: float | None = None  # solo si se envían lat/lng
    interested_count: int = 0
    saved: bool = False
    my_application_status: str | None = None
