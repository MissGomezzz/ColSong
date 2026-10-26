from pydantic import BaseModel, Field

from app.core.validators import HttpUrlStr

# Campos que cuentan para el porcentaje de perfil completo y su etiqueta en español.
COMPLETENESS_FIELDS = {
    "stage_name": "nombre artístico",
    "artist_type": "tipo de artista",
    "bio": "biografía",
    "genres": "géneros",
    "phone": "teléfono",
    "instagram": "Instagram",
    "portfolio_url": "portafolio",
    "video_url": "video",
}


class ArtistProfileIn(BaseModel):
    stage_name: str | None = Field(None, min_length=1, max_length=120)
    artist_type: str | None = Field(None, max_length=80)
    bio: str | None = Field(None, max_length=2000)
    genres: list[str] | None = None
    city: str | None = Field(None, max_length=80)
    phone: str | None = Field(None, max_length=40)
    instagram: str | None = Field(None, max_length=120)
    portfolio_url: HttpUrlStr | None = Field(None, max_length=300)
    video_url: HttpUrlStr | None = Field(None, max_length=300)


class ArtistProfileOut(BaseModel):
    user_id: int
    stage_name: str
    artist_type: str | None
    bio: str | None
    genres: list[str]
    city: str
    phone: str | None
    instagram: str | None
    portfolio_url: str | None
    video_url: str | None
    completeness: int  # 0-100
    missing: list[str]  # etiquetas de lo que falta, en orden de prioridad
