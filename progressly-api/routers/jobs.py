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
    DISABLED: Activity cleanup is no longer performed.
    All activities are now retained indefinitely.
    
    This endpoint is kept for backward compatibility but no longer deletes any data.
    
    Returns:
        dict: Success message indicating no cleanup was performed
    """
    # Activity cleanup has been disabled - all activities are now retained indefinitely
    return {
        "success": True,
        "message": "Activity cleanup is disabled. All activities are retained indefinitely.",
        "deleted_count": 0,
        "note": "This endpoint is kept for backward compatibility but no longer deletes data."
    }
