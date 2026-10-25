from typing import Literal

from pydantic import BaseModel, Field


class VenueIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    venue_type: str = Field(min_length=2, max_length=80)
    description: str | None = Field(None, max_length=2000)
    neighborhood: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=3, max_length=200)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    phone: str | None = Field(None, max_length=40)
    image_url: str | None = Field(None, max_length=500)
    accent: Literal["purple", "orange", "blue"] = "purple"


class VenueUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=120)
    venue_type: str | None = Field(None, min_length=2, max_length=80)
    description: str | None = Field(None, max_length=2000)
    neighborhood: str | None = Field(None, min_length=2, max_length=80)
    address: str | None = Field(None, min_length=3, max_length=200)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    phone: str | None = Field(None, max_length=40)
    image_url: str | None = Field(None, max_length=500)
    accent: Literal["purple", "orange", "blue"] | None = None


class VenueOut(BaseModel):
    id: int
    name: str
    venue_type: str
    description: str | None
    neighborhood: str
    address: str
    latitude: float | None
    longitude: float | None
    phone: str | None
    image_url: str | None
    accent: str
    verified: bool
    response_hours: int

    model_config = {"from_attributes": True}
