from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel

from database import get_session
from dependencies import get_current_user
from models import DailyTarget

router = APIRouter()

# --- Pydantic Models for API Data ---

class DailyTargetCreate(SQLModel):
    category_name: str
    target_hours: float

class DailyTargetUpdate(SQLModel):
    category_name: str
    target_hours: float

# --- API Endpoints ---

@router.get("/", response_model=List[DailyTarget])
def get_user_targets(
    *,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    """Fetch all daily targets for the authenticated user."""
    targets = session.exec(
        select(DailyTarget).where(DailyTarget.user_id == user_id)
    ).all()
    return targets

@router.post("/", response_model=DailyTarget)
def create_user_target(
    *,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
    target: DailyTargetCreate
):
    """Create a new daily target for the authenticated user."""
    db_target = DailyTarget.from_orm(target, update={'user_id': user_id})
    session.add(db_target)
    session.commit()
    session.refresh(db_target)
    return db_target

@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_target(
    *,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
    target_id: int
):
    """Delete a specific daily target owned by the authenticated user."""
    db_target = session.get(DailyTarget, target_id)
    if not db_target:
        raise HTTPException(status_code=404, detail="Target not found")
    if db_target.user_id != user_id:
        # Important security check: users can only delete their own targets
        raise HTTPException(status_code=403, detail="Not authorized to delete this target")

    session.delete(db_target)
    session.commit()
    return

@router.put("/{target_id}", response_model=DailyTarget)
def update_user_target(
    *,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
    target_id: int,
    target: DailyTargetUpdate
):
    """Update a specific daily target owned by the authenticated user."""
    db_target = session.get(DailyTarget, target_id)
    if not db_target:
        raise HTTPException(status_code=404, detail="Target not found")
    if db_target.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this target")

    # Update fields
    db_target.category_name = target.category_name
    db_target.target_hours = target.target_hours

    session.add(db_target)
    session.commit()
    session.refresh(db_target)
    return db_target