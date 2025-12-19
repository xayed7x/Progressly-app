# progressly-api/effective_date.py
"""
Effective Date Calculation Module

This module implements the "Wake-up to Wake-up" day tracking system.
An activity's effective_date is the "psychological day" it belongs to,
which may differ from the calendar date for late-night activities.

Rules:
1. Day only ends when Night Sleep (2h+, ends 4AM-12PM) is logged
2. OR when user manually clicks "End My Day"
3. NO automatic cutoff at 6 AM - session continues indefinitely
"""

from datetime import date, time, datetime, timedelta
from typing import Optional
from sqlmodel import Session, select
from models import LoggedActivity, Category


def get_sleep_category_id(user_id: str, db: Session) -> Optional[int]:
    """Get the Sleep category ID for a user."""
    statement = select(Category).where(
        Category.user_id == user_id,
        Category.name.ilike("sleep")
    )
    category = db.exec(statement).first()
    return category.id if category else None


def has_night_sleep_ended_today(user_id: str, db: Session, today: date) -> bool:
    """
    Check if user has logged a Night Sleep that ended today.
    
    Night Sleep criteria:
    - Category is "Sleep"
    - Duration >= 2 hours
    - End time is between 4 AM and 12 PM
    """
    sleep_category_id = get_sleep_category_id(user_id, db)
    if not sleep_category_id:
        return False
    
    # Get sleep activities from today
    yesterday = today - timedelta(days=1)
    statement = select(LoggedActivity).where(
        LoggedActivity.user_id == user_id,
        LoggedActivity.category_id == sleep_category_id,
        # Activities from yesterday or today (to catch overnight sleep)
        LoggedActivity.activity_date >= datetime.combine(yesterday, time(0, 0)),
        LoggedActivity.activity_date < datetime.combine(today + timedelta(days=1), time(0, 0))
    )
    
    sleep_activities = db.exec(statement).all()
    
    for activity in sleep_activities:
        end_hour = activity.end_time.hour
        
        # Check if end time is in morning wake-up window (4 AM - 12 PM)
        if not (4 <= end_hour < 12):
            continue
        
        # Calculate duration
        start_minutes = activity.start_time.hour * 60 + activity.start_time.minute
        end_minutes = activity.end_time.hour * 60 + activity.end_time.minute
        
        # Handle overnight sleep (end < start means crossed midnight)
        if end_minutes < start_minutes:
            end_minutes += 24 * 60
        
        duration_hours = (end_minutes - start_minutes) / 60
        
        # Night sleep must be at least 2 hours
        if duration_hours >= 2:
            return True
    
    return False


def calculate_effective_date(
    user_id: str,
    activity_start_time: time,
    calendar_date: date,
    db: Session,
    manual_end_day_date: Optional[date] = None
) -> date:
    """
    Calculate the effective date (psychological day) for an activity.
    
    Priority:
    1. If manual "End Day" was triggered, use that date
    2. If Night Sleep ended today, use today
    3. Otherwise, check if we're still in yesterday's session
    
    Args:
        user_id: The user's ID
        activity_start_time: When the activity started (time only)
        calendar_date: The calendar date from the system clock
        db: Database session
        manual_end_day_date: If user clicked "End Day", this is the new date
    
    Returns:
        The effective_date this activity belongs to
    """
    # Priority 1: Manual "End Day" override
    if manual_end_day_date is not None:
        return manual_end_day_date
    
    # Priority 2: Check if Night Sleep ended today (day has naturally advanced)
    if has_night_sleep_ended_today(user_id, db, calendar_date):
        return calendar_date
    
    # Priority 3: No Night Sleep yet - check if still in yesterday's session
    # If current time is in early morning (before typical wake-up), 
    # and no sleep logged, stay in yesterday's session
    if activity_start_time.hour < 12:  # Before noon
        # Check if there's any activity logged today already
        # If not, this might be a continuation of yesterday's session
        yesterday = calendar_date - timedelta(days=1)
        
        # Check for activities already logged with today's effective_date
        statement = select(LoggedActivity).where(
            LoggedActivity.user_id == user_id,
            LoggedActivity.effective_date == calendar_date
        ).limit(1)
        
        has_today_activities = db.exec(statement).first() is not None
        
        # If no activities logged for today yet and no night sleep,
        # this is still part of yesterday's session
        if not has_today_activities:
            return yesterday
    
    # Default: use calendar date
    return calendar_date


def get_user_current_effective_date(user_id: str, db: Session) -> date:
    """
    Get the current effective date for a user's active session.
    
    This is used by the dashboard to determine which day to show.
    """
    today = date.today()
    
    # If night sleep ended today, it's a new day
    if has_night_sleep_ended_today(user_id, db, today):
        return today
    
    # Otherwise, might still be in yesterday's session
    yesterday = today - timedelta(days=1)
    
    # Check for activities with today's effective_date
    statement = select(LoggedActivity).where(
        LoggedActivity.user_id == user_id,
        LoggedActivity.effective_date == today
    ).limit(1)
    
    if db.exec(statement).first():
        return today
    
    # No activities today and no sleep - still yesterday's session
    return yesterday
