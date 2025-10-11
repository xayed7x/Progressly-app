# progressly-api/routers/summary.py

import logging
from datetime import date
from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import SQLModel, Session, select, func, case

# --- Import our new, clean dependencies ---
from dependencies import get_current_user, get_db_session
from models import Category, LoggedActivity


# --- API Response Model (No Change) ---
class DailySummaryItem(SQLModel):
    category_id: int
    category_name: str
    category_color: str
    total_duration_minutes: float


# --- Create the Router (No Change) ---
router = APIRouter(
    prefix="/api/summary",
    tags=["summary"],
    responses={404: {"description": "Not found"}},
)


# --- The Main API Endpoint (Now with correct dependencies) ---
@router.get(
    "/daily/{summary_date}",
    response_model=List[DailySummaryItem],
)
def get_daily_summary(summary_date: date, db: Session = Depends(get_db_session), user_id: str = Depends(get_current_user)):
    """
    Calculates the total time spent in each category for a specific user on a given date.
    This endpoint powers the daily data visualization chart.
    """

    duration_calculation = case(
        (LoggedActivity.end_time < LoggedActivity.start_time,
         func.extract('epoch', LoggedActivity.end_time - LoggedActivity.start_time) + 86400),
        else_=func.extract('epoch', LoggedActivity.end_time - LoggedActivity.start_time)
    )

    statement = (
        select(
            Category.id,
            Category.name,
            Category.color,
            func.sum(duration_calculation).label("total_seconds")
        )
        .join(Category, LoggedActivity.category_id == Category.id)
        .where(LoggedActivity.user_id == user_id)
        .where(func.date(LoggedActivity.activity_date) == summary_date)
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(duration_calculation).desc())
    )

    results = db.exec(statement).all()

    summary_data = [
        DailySummaryItem(
            category_id=res.id,
            category_name=res.name,
            category_color=res.color,
            total_duration_minutes=round(res.total_seconds / 60, 2)
        )
        for res in results
    ]

    # Safety net: Check if total exceeds 24 hours (1440 minutes)
    total_minutes = sum(item.total_duration_minutes for item in summary_data)
    
    if total_minutes > 1440:
        logging.warning(f"Data for user {user_id} on {summary_date} exceeded 24 hours! Total: {total_minutes} minutes")
        
        # Normalize data proportionally to exactly 1440 minutes
        normalization_factor = 1440 / total_minutes
        for item in summary_data:
            item.total_duration_minutes = round(item.total_duration_minutes * normalization_factor, 2)

    return summary_data