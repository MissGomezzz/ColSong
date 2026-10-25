from sqlalchemy.orm import Session

from app.modules.artists.models import ArtistProfile
from app.modules.artists.schemas import COMPLETENESS_FIELDS, ArtistProfileOut


def create_empty_profile(db: Session, user_id: int, stage_name: str) -> ArtistProfile:
    profile = ArtistProfile(user_id=user_id, stage_name=stage_name, genres=[])
    db.add(profile)
    return profile


def to_out(profile: ArtistProfile) -> ArtistProfileOut:
    missing = [label for key, label in COMPLETENESS_FIELDS.items() if not getattr(profile, key)]
    total = len(COMPLETENESS_FIELDS)
    return ArtistProfileOut(
        user_id=profile.user_id,
        stage_name=profile.stage_name,
        artist_type=profile.artist_type,
        bio=profile.bio,
        genres=profile.genres or [],
        city=profile.city,
        phone=profile.phone,
        instagram=profile.instagram,
        portfolio_url=profile.portfolio_url,
        video_url=profile.video_url,
        completeness=round((total - len(missing)) / total * 100),
        missing=missing,
    )
