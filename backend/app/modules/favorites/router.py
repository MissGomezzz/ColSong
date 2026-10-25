from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.deps import get_current_user
from app.modules.favorites.models import Favorite
from app.modules.opportunities import service as opportunities_service
from app.modules.opportunities.models import Opportunity
from app.modules.opportunities.schemas import OpportunityOut
from app.modules.users.models import User

router = APIRouter(tags=["favoritos"])


@router.get("/favorites", response_model=list[OpportunityOut])
def my_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return opportunities_service.list_opportunities(db, user, favorites_only=True)


@router.put("/opportunities/{opportunity_id}/favorite", response_model=dict)
def save_favorite(opportunity_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Opportunity, opportunity_id):
        raise HTTPException(404, "Oportunidad no encontrada")
    if not db.get(Favorite, (user.id, opportunity_id)):
        db.add(Favorite(user_id=user.id, opportunity_id=opportunity_id))
        db.commit()
    return {"saved": True}


@router.delete("/opportunities/{opportunity_id}/favorite", response_model=dict)
def remove_favorite(opportunity_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    favorite = db.get(Favorite, (user.id, opportunity_id))
    if favorite:
        db.delete(favorite)
        db.commit()
    return {"saved": False}
