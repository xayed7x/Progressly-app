from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Annotated, Optional, List
from datetime import datetime
from uuid import UUID

from dependencies import get_current_user, get_db_session
from models import Challenge, ChallengeCreate

router = APIRouter()
DBSession = Annotated[Session, Depends(get_db_session)]

@router.post("/api/challenges", response_model=Challenge)
def create_challenge(
    challenge_data: ChallengeCreate, 
    db: DBSession, 
    user_id: str = Depends(get_current_user)
):
    """Create a new transformation challenge."""
    try:
        # Check for existing active challenge
        statement = select(Challenge).where(Challenge.user_id == user_id).where(Challenge.status == "active")
        existing_challenge = db.exec(statement).first()
        
        if existing_challenge:
            # For now, we can maybe mark the old one as abandoned or completed?
            # Or just let them have multiple (though UI handles one).
            # Let's auto-complete/abandon the old one to keep it clean.
            existing_challenge.status = "abandoned"
            existing_challenge.end_date = datetime.utcnow().date()
            db.add(existing_challenge)
            # We don't return here, we proceed to create the new one
        
        # Create new challenge
        new_challenge = Challenge(
            **challenge_data.model_dump(),
            user_id=user_id
        )
        
        db.add(new_challenge)
        db.commit()
        db.refresh(new_challenge)
        return new_challenge
        
    except Exception as e:
        print(f"ERROR creating challenge: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/challenges/active", response_model=Optional[Challenge])
def get_active_challenge(db: DBSession, user_id: str = Depends(get_current_user)):
    """Get the user's currently active challenge."""
    try:
        # Sort by creation date desc to get the latest active one
        statement = (
            select(Challenge)
            .where(Challenge.user_id == user_id)
            .where(Challenge.status == "active")
            .order_by(Challenge.created_at.desc())
        )
        challenge = db.exec(statement).first()
        return challenge
    except Exception as e:
        print(f"ERROR getting active challenge: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch active challenge")

@router.delete("/api/challenges/{challenge_id}")
def delete_challenge(
    challenge_id: UUID, 
    db: DBSession, 
    user_id: str = Depends(get_current_user)
):
    """Delete a challenge."""
    try:
        challenge = db.get(Challenge, challenge_id)
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
            
        if challenge.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
        db.delete(challenge)
        db.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting challenge: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete challenge")
