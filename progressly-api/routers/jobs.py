# progressly-api/routers/jobs.py

import os
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select, delete
from typing import Annotated

from database import get_session
from models import LoggedActivity

# Create the router
router = APIRouter(
    prefix="/api/jobs",
    tags=["jobs"],
    responses={404: {"description": "Not found"}},
)

# Dependency to check for cleanup token
async def verify_cleanup_token(x_cleanup_token: Annotated[str | None, Header()] = None):
    """
    Verify that the request contains a valid cleanup token.
    This endpoint is protected and requires a secret token in the X-CLEANUP-TOKEN header.
    """
    expected_token = os.environ.get("CLEANUP_SECRET_TOKEN")
    
    if not expected_token:
        raise HTTPException(
            status_code=500, 
            detail="Cleanup service not configured. Missing CLEANUP_SECRET_TOKEN environment variable."
        )
    
    if not x_cleanup_token:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized. Missing X-CLEANUP-TOKEN header."
        )
    
    if x_cleanup_token != expected_token:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized. Invalid cleanup token."
        )
    
    return True

# Type hint for the database session
DBSession = Annotated[Session, Depends(get_session)]

@router.post("/cleanup-activities")
def cleanup_old_activities(
    db: DBSession,
    _: bool = Depends(verify_cleanup_token)
):
    """
    Delete all logged activities that are older than 3 days.
    
    This endpoint is protected and requires a valid X-CLEANUP-TOKEN header.
    It should be called by a trusted source like a scheduled job runner.
    
    Returns:
        dict: Success message with the number of deleted records
    """
    try:
        # Calculate the cutoff date (4 days ago)
        # This provides a safe look-back buffer for wake-up to wake-up logic
        cutoff_date = date.today() - timedelta(days=4)
        
        # First, count how many records will be deleted for logging
        count_statement = select(LoggedActivity).where(
            LoggedActivity.activity_date < cutoff_date
        )
        records_to_delete = db.exec(count_statement).all()
        count = len(records_to_delete)
        
        if count == 0:
            return {
                "success": True,
                "message": "No activities older than 4 days found.",
                "deleted_count": 0,
                "cutoff_date": cutoff_date.isoformat()
            }
        
        # Delete all activities older than 4 days
        delete_statement = delete(LoggedActivity).where(
            LoggedActivity.activity_date < cutoff_date
        )
        
        result = db.exec(delete_statement)
        db.commit()
        
        return {
            "success": True,
            "message": f"Successfully deleted {count} activities older than 4 days.",
            "deleted_count": count,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        # Rollback the transaction in case of error
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cleanup activities: {str(e)}"
        )
