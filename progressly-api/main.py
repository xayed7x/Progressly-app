# progressly-api/main.py

import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, time
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlmodel import SQLModel, Session, select
from sqlalchemy import func, and_, or_
from typing import Annotated, Optional
from fastapi.middleware.cors import CORSMiddleware

# We only need get_session from database now for the DBSession type hint
from database import engine, get_session

# Import the models used in this file
from models import Goal, GoalCreate, LoggedActivity, ActivityCreate, Category, ActivityReadWithCategory

# Import our routers
from routers import categories, summary, jobs

# Import the shared dependencies used in this file
from dependencies import DBSession, ClerkSession


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating tables..")
    create_db_and_tables()
    yield

app = FastAPI(
    title="Progressly API",
    version="0.1.0",
    lifespan=lifespan
)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
origins = [FRONTEND_URL]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(categories.router)
app.include_router(summary.router)
app.include_router(jobs.router)

# === Root & Goal Endpoints (No change) ===
@app.get("/")
def read_root(): return {"message": "Welcome to the Progressly API!"}

# The endpoint definitions below are now cleaner as they use the imported dependencies
@app.post("/api/goals", response_model=Goal)
def create_goal(goal_data: GoalCreate, db: DBSession, clerk_session: ClerkSession):
    user_id = clerk_session.payload['sub']
    new_goal = Goal(content=goal_data.content, user_id=user_id)
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@app.get("/api/goals", response_model=list[Goal])
def get_goals(db: DBSession, clerk_session: ClerkSession):
    user_id = clerk_session.payload['sub']
    statement = select(Goal).where(Goal.user_id == user_id)
    goals = db.exec(statement).all()
    return goals

# === Activity Endpoints ===
@app.post("/api/activities", response_model=LoggedActivity)
def create_activity(activity_data: ActivityCreate, db: DBSession, clerk_session: ClerkSession):
    user_id = clerk_session.payload['sub']
    activity_dict = activity_data.model_dump()
    today_date = datetime.utcnow().date()
    
    if activity_data.end_time < activity_data.start_time:
        date_to_save = today_date - timedelta(days=1)
    else:
        date_to_save = today_date

    new_activity = LoggedActivity(
        **activity_dict,
        user_id=user_id,
        activity_date=date_to_save
    )

    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    return new_activity

@app.get("/api/activities", response_model=list[ActivityReadWithCategory])
def get_activities(
    db: DBSession, 
    clerk_session: ClerkSession,
    target_date: Optional[date] = Query(None, description="Target date for wake-up to wake-up cycle")
):
    """
    Get activities using wake-up to wake-up day cycle logic.
    If target_date is provided, returns activities from wake-up on target_date to wake-up on target_date+1.
    If no target_date provided, defaults to today.
    """
    user_id = clerk_session.payload['sub']
    
    # Use target_date if provided, otherwise default to today
    if target_date is None:
        target_date = date.today()
    
    # First, fetch a 4-day window of data to ensure we have enough context
    # This includes the day before target_date to catch sleep that started the previous day
    data_start = target_date - timedelta(days=1)
    data_end = target_date + timedelta(days=2)
    
    # Get all activities in the 4-day window
    base_statement = (
        select(LoggedActivity)
        .where(LoggedActivity.user_id == user_id)
        .where(func.date(LoggedActivity.activity_date) >= data_start)
        .where(func.date(LoggedActivity.activity_date) <= data_end)
    )
    
    all_activities = db.exec(base_statement).all()
    
    # Find the user's Sleep category ID
    sleep_category = db.exec(
        select(Category)
        .where(Category.user_id == user_id)
        .where(Category.name.ilike("sleep"))
    ).first()
    
    sleep_category_id = sleep_category.id if sleep_category else None
    
    # Implement wake-up to wake-up algorithm
    start_boundary, end_boundary = find_wake_up_boundaries(
        all_activities, target_date, sleep_category_id
    )
    
    # Filter activities based on wake-up boundaries
    filtered_activities = []
    for activity in all_activities:
        activity_datetime = datetime.combine(activity.activity_date, activity.start_time)
        
        if start_boundary <= activity_datetime < end_boundary:
            filtered_activities.append(activity)
    
    # Sort by activity date and start time
    filtered_activities.sort(key=lambda x: (x.activity_date, x.start_time), reverse=True)
    
    # Build response with nested category data
    results = []
    for a in filtered_activities:
        category_obj = None
        if a.category_rel is not None:
            category_obj = {
                "id": a.category_rel.id,
                "name": a.category_rel.name,
                "color": a.category_rel.color,
                "is_default": a.category_rel.is_default,
            }

        results.append(
            {
                "id": a.id,
                "activity_name": a.activity_name,
                "start_time": a.start_time,
                "end_time": a.end_time,
                "activity_date": a.activity_date,
                "user_id": a.user_id,
                "category_id": a.category_id,
                "category": category_obj,
            }
        )

    return results


def find_wake_up_boundaries(activities, target_date, sleep_category_id):
    """
    Find wake-up boundaries for the target date using sleep detection.
    Returns (start_boundary, end_boundary) as datetime objects.
    """
    # Default to midnight-to-midnight boundaries
    start_boundary = datetime.combine(target_date, time(0, 0))
    end_boundary = datetime.combine(target_date + timedelta(days=1), time(0, 0))
    
    if not sleep_category_id:
        # No sleep category found, use default boundaries
        return start_boundary, end_boundary
    
    # Find sleep activities that ended on target_date (wake-up on target_date)
    target_date_sleep = []
    for activity in activities:
        if (activity.category_id == sleep_category_id and 
            activity.activity_date == target_date):
            target_date_sleep.append(activity)
    
    # Find sleep activities that ended on target_date + 1 (wake-up on target_date + 1)
    next_date_sleep = []
    next_date = target_date + timedelta(days=1)
    for activity in activities:
        if (activity.category_id == sleep_category_id and 
            activity.activity_date == next_date):
            next_date_sleep.append(activity)
    
    # Find the longest sleep session that ended on target_date
    if target_date_sleep:
        longest_sleep = max(target_date_sleep, key=lambda x: calculate_duration(x.start_time, x.end_time))
        start_boundary = datetime.combine(target_date, longest_sleep.end_time)
    
    # Find the longest sleep session that ended on target_date + 1
    if next_date_sleep:
        longest_sleep = max(next_date_sleep, key=lambda x: calculate_duration(x.start_time, x.end_time))
        end_boundary = datetime.combine(next_date, longest_sleep.end_time)
    
    return start_boundary, end_boundary


def calculate_duration(start_time, end_time):
    """Calculate duration in minutes, handling overnight activities."""
    if end_time < start_time:
        # Overnight activity (e.g., 23:00 to 07:00)
        return (24 * 60) - (start_time.hour * 60 + start_time.minute) + (end_time.hour * 60 + end_time.minute)
    else:
        # Same-day activity
        return (end_time.hour * 60 + end_time.minute) - (start_time.hour * 60 + start_time.minute)

# === Seed Endpoint ===
@app.post("/api/users/seed-defaults", status_code=201)
def seed_default_categories(db: DBSession, clerk_session: ClerkSession):
    user_id = clerk_session.payload['sub']

    existing_defaults = db.exec(
        select(Category).where(Category.user_id == user_id, Category.is_default == True)
    ).first()

    if existing_defaults:
        return {"message": "Default categories already exist for this user."}

    default_categories_data = [
        {"name": "Work", "color": "#3b82f6"}, {"name": "Study", "color": "#22c55e"},
        {"name": "Skill Development", "color": "#14b8a6"}, {"name": "Spiritual & Faith", "color": "#f59e0b"},
        {"name": "Health & Fitness", "color": "#ef4444"}, {"name": "Personal Time", "color": "#8b5cf6"},
        {"name": "Family & Social", "color": "#eab308"}, {"name": "Social Media", "color": "#ec4899"},
        {"name": "Leisure & Hobbies", "color": "#06b6d4"}, {"name": "Eating & Nutrition", "color": "#f97316"},
        {"name": "Transportation", "color": "#64748b"}, {"name": "Home & Chores", "color": "#78716c"},
        {"name": "Sleep", "color": "#4f46e5"},
    ]

    for cat_data in default_categories_data:
        new_category = Category(
            name=cat_data["name"], color=cat_data["color"], user_id=user_id, is_default=True
        )
        db.add(new_category)
    
    db.commit()

    return {"message": f"Successfully created {len(default_categories_data)} default categories."}