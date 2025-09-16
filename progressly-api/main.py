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
from models import Goal, GoalCreate, LoggedActivity, ActivityCreate, ActivityUpdate, Category, ActivityReadWithCategory

# Import our routers
from routers import categories, summary, jobs

# Import the shared dependencies used in this file
from dependencies import DBSession, ClerkSession


# --- NEW RESPONSE MODELS ---
class PieChartData(SQLModel):
    id: int
    name: str
    duration: int
    color: str

class DashboardBootstrapResponse(SQLModel):
    activities_last_3_days: list[ActivityReadWithCategory]
    pie_chart_data: list[PieChartData]
    last_end_time: Optional[time]
    categories: list[Category]


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

@app.get("/api/health", status_code=200)
def health_check():
    """
    A simple endpoint to verify that the API is running.
    Used by external services to keep the instance alive.
    """
    return {"status": "ok"}

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
    Returns activities from wake-up on target_date to wake-up on target_date+1.
    If no target_date provided, defaults to today.
    """
    user_id = clerk_session.payload['sub']
    
    # Use target_date if provided, otherwise default to today
    if target_date is None:
        target_date = date.today()
    
    # Fetch a 4-day window of data to ensure we have enough context
    # This includes the day before target_date to catch sleep that started the previous day
    data_start = target_date - timedelta(days=1)
    data_end = target_date + timedelta(days=2)
    
    # Get all activities in the 4-day window
    base_statement = (
        select(LoggedActivity)
        .where(LoggedActivity.user_id == user_id)
        .where(func.date(LoggedActivity.activity_date) >= data_start)
        .where(func.date(LoggedActivity.activity_date) <= data_end)
        .order_by(LoggedActivity.activity_date.desc(), LoggedActivity.start_time.desc())
    )
    
    all_activities = db.exec(base_statement).all()
    
    # Find the user's Sleep category
    sleep_category = db.exec(
        select(Category)
        .where(Category.user_id == user_id)
        .where(Category.name.ilike("sleep"))
    ).first()
    
    sleep_category_id = sleep_category.id if sleep_category else None
    
    # Get the wake-up boundaries for the target date
    start_boundary, end_boundary = find_wake_up_boundaries(
        all_activities, target_date, sleep_category_id
    )
    
    # Filter activities that fall within the wake-up boundaries
    filtered_activities = []
    for activity in all_activities:
        # Create datetime objects for comparison
        activity_start = datetime.combine(activity.activity_date, activity.start_time)
        
        # Handle activities that cross midnight
        activity_end = datetime.combine(
            activity.activity_date + timedelta(days=1) if activity.end_time < activity.start_time 
            else activity.activity_date, 
            activity.end_time
        )
        
        # Check if activity overlaps with the target day's wake-up boundaries
        if activity_start < end_boundary and activity_end > start_boundary:
            filtered_activities.append(activity)
    
    # Sort activities by start time in descending order
    filtered_activities.sort(
        key=lambda x: (x.activity_date, x.start_time), 
        reverse=True
    )
    
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
    
    if not sleep_category_id or not activities:
        # No sleep category found or no activities, use default boundaries
        return start_boundary, end_boundary
    
    # Find sleep activities using full timestamp comparison
    previous_day_sleeps = []
    current_day_sleeps = []
    
    # Get the previous day's date
    previous_date = target_date - timedelta(days=1)
    
    for activity in activities:
        if activity.category_id != sleep_category_id:
            continue
            
        # Create full timestamp for the activity's start and end times
        activity_start = datetime.combine(activity.activity_date, activity.start_time)
        activity_end = datetime.combine(
            activity.activity_date + timedelta(days=1) if activity.end_time < activity.start_time 
            else activity.activity_date, 
            activity.end_time
        )
        
        # Check if this sleep started on the previous day and ended on target_date
        if activity_start.date() == previous_date and activity_end.date() == target_date:
            previous_day_sleeps.append((activity_start, activity_end, activity))
        
        # Check if this sleep starts on target_date and ends the next day
        elif activity_start.date() == target_date and activity_end.date() == (target_date + timedelta(days=1)):
            current_day_sleeps.append((activity_start, activity_end, activity))
    
    # Find the latest wake-up time from the previous night's sleep
    if previous_day_sleeps:
        # Sort by end time descending to get the latest wake-up
        previous_day_sleeps.sort(key=lambda x: x[1], reverse=True)
        latest_wake_up = previous_day_sleeps[0][1]
        start_boundary = latest_wake_up
    
    # Find the next night's sleep end time (wake-up time for the next day)
    if current_day_sleeps:
        # Sort by end time descending to get the latest wake-up
        current_day_sleeps.sort(key=lambda x: x[1], reverse=True)
        next_wake_up = current_day_sleeps[0][1]
        end_boundary = next_wake_up
    
    return start_boundary, end_boundary


def calculate_duration(start_time, end_time):
    """Calculate duration in minutes, handling overnight activities."""
    if end_time < start_time:
        # Overnight activity (e.g., 23:00 to 07:00)
        return (24 * 60) - (start_time.hour * 60 + start_time.minute) + (end_time.hour * 60 + end_time.minute)
    else:
        # Same-day activity
        return (end_time.hour * 60 + end_time.minute) - (start_time.hour * 60 + start_time.minute)

# === Dashboard Bootstrap Endpoint ===
@app.get("/api/dashboard-bootstrap", response_model=DashboardBootstrapResponse)
def get_dashboard_bootstrap(db: DBSession, clerk_session: ClerkSession):
    user_id = clerk_session.payload['sub']
    today = date.today()
    three_days_ago = today - timedelta(days=2)

    # 1. Fetch Activities from the last 3 days
    activities_statement = (
        select(LoggedActivity)
        .where(LoggedActivity.user_id == user_id)
        .where(LoggedActivity.activity_date >= three_days_ago)
        .order_by(LoggedActivity.activity_date.desc(), LoggedActivity.start_time.desc())
    )
    activities_last_3_days_raw = db.exec(activities_statement).all()

    activities_last_3_days = []
    for a in activities_last_3_days_raw:
        category_obj = None
        if a.category_rel:
            category_obj = {
                "id": a.category_rel.id,
                "name": a.category_rel.name,
                "color": a.category_rel.color,
                "is_default": a.category_rel.is_default,
            }
        activities_last_3_days.append(
            ActivityReadWithCategory(
                id=a.id,
                activity_name=a.activity_name,
                start_time=a.start_time,
                end_time=a.end_time,
                activity_date=a.activity_date,
                user_id=a.user_id,
                category_id=a.category_id,
                category=category_obj,
            )
        )

    # 2. Aggregate Pie Chart Data for today
    today_activities_statement = (
        select(LoggedActivity)
        .where(LoggedActivity.user_id == user_id)
        .where(LoggedActivity.activity_date == today)
    )
    today_activities = db.exec(today_activities_statement).all()

    user_categories_statement = select(Category).where(Category.user_id == user_id)
    user_categories = db.exec(user_categories_statement).all()
    category_map = {cat.id: cat for cat in user_categories}

    category_durations = {}
    for act in today_activities:
        duration = calculate_duration(act.start_time, act.end_time)
        if act.category_id and act.category_id in category_map:
            category = category_map[act.category_id]
            if category.id not in category_durations:
                category_durations[category.id] = {"duration": 0, "name": category.name, "color": category.color}
            category_durations[category.id]["duration"] += duration

    pie_chart_data = [
        PieChartData(id=cat_id, name=data["name"], duration=data["duration"], color=data["color"])
        for cat_id, data in category_durations.items()
    ]

    # 3. Fetch Last End Time
    latest_activity_statement = (
        select(LoggedActivity)
        .where(LoggedActivity.user_id == user_id)
        .order_by(LoggedActivity.activity_date.desc(), LoggedActivity.start_time.desc())
        .limit(1)
    )
    latest_activity = db.exec(latest_activity_statement).first()
    last_end_time = latest_activity.end_time if latest_activity else None

    return DashboardBootstrapResponse(
        activities_last_3_days=activities_last_3_days,
        pie_chart_data=pie_chart_data,
        last_end_time=last_end_time,
        categories=user_categories,
    )

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


# === Activity Update Endpoint ===
@app.put("/api/activities/{activity_id}", response_model=ActivityReadWithCategory)
def update_activity(
    activity_id: int,
    update_data: ActivityUpdate,
    db: DBSession,
    clerk_session: ClerkSession
):
    user_id = clerk_session.payload['sub']
    
    # Fetch the activity from database
    activity = db.get(LoggedActivity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Verify ownership - critical security check
    if activity.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this activity")
    
    # Update the fields
    activity.activity_name = update_data.activity_name
    activity.start_time = update_data.start_time
    activity.end_time = update_data.end_time
    activity.category_id = update_data.category_id
    
    # Commit changes and refresh
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    # Return updated activity with category data
    category = db.get(Category, activity.category_id) if activity.category_id else None
    
    return ActivityReadWithCategory(
        id=activity.id,
        user_id=activity.user_id,
        activity_date=activity.activity_date,
        activity_name=activity.activity_name,
        start_time=activity.start_time,
        end_time=activity.end_time,
        category_id=activity.category_id,
        category=category
    )