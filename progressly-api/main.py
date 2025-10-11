# progressly-api/main.py

import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, time
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlmodel import SQLModel, Session, select
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Annotated, Optional
from fastapi.middleware.cors import CORSMiddleware

# We only need get_session from database now for the DBSession type hint
from database import engine, get_session

# Import the models used in this file
from models import Goal, GoalCreate, LoggedActivity, ActivityCreate, ActivityUpdate, Category, ActivityReadWithCategory, DailyTarget, CategoryCreate

# Import our routers
from routers import summary, jobs, ai as ai_router, targets as targets_router, categories as categories_router

# Import the shared dependencies used in this file
from dependencies import get_current_user, get_db_session

DBSession = Annotated[Session, Depends(get_db_session)]

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

app.include_router(categories_router.router, prefix="/api/categories", tags=["categories"])
app.include_router(summary.router)
app.include_router(jobs.router)
app.include_router(ai_router.router, prefix="/api", tags=["ai"])
app.include_router(targets_router.router, prefix="/api/targets", tags=["targets"])

# === Root & Goal Endpoints (No change) ===
@app.get("/")
def read_root(): return {"message": "Welcome to the Progressly API!"}

@app.head("/", include_in_schema=False)
def read_root_head():
    return

@app.get("/api/health", status_code=200)
def health_check():
    """
    A simple endpoint to verify that the API is running.
    Used by external services to keep the instance alive.
    """
    return {"status": "ok"}

@app.head("/api/health", status_code=200, include_in_schema=False)
def health_check_head():
    """
    A simple endpoint to verify that the API is running for HEAD requests.
    Used by external services to keep the instance alive.
    """
    return

# The endpoint definitions below are now cleaner as they use the imported dependencies
# === Goals Endpoints ===
@app.post("/api/goals", response_model=Goal)
def create_goal(goal_data: GoalCreate, db: DBSession, user_id: str = Depends(get_current_user)):
    """Create a new goal for the authenticated user."""
    try:
        new_goal = Goal(content=goal_data.content, user_id=user_id)
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)
        return new_goal
    except Exception as e:
        print(f"ERROR in create_goal: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create goal.")

@app.get("/api/goals", response_model=list[Goal])
def get_goals(db: DBSession, user_id: str = Depends(get_current_user)):
    """Get all goals for the authenticated user."""
    try:
        statement = select(Goal).where(Goal.user_id == user_id)
        goals = db.exec(statement).all()
        return goals
    except Exception as e:
        print(f"ERROR in get_goals: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch goals.")

# === Daily Targets Endpoints ===
@app.post("/api/targets", response_model=DailyTarget)
def create_daily_target(
    target_data: dict,
    db: DBSession,
    user_id: str = Depends(get_current_user)
):
    """Create a new daily time target for a category."""
    try:
        new_target = DailyTarget(
            user_id=user_id,
            category_name=target_data["category_name"],
            target_hours=target_data["target_hours"]
        )
        db.add(new_target)
        db.commit()
        db.refresh(new_target)
        return new_target
    except Exception as e:
        print(f"ERROR in create_daily_target: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create daily target.")

@app.get("/api/targets/", response_model=list[DailyTarget])
@app.get("/api/targets", response_model=list[DailyTarget])
def get_daily_targets(db: DBSession, user_id: str = Depends(get_current_user)):
    """Get all daily targets for the authenticated user."""
    try:
        statement = select(DailyTarget).where(DailyTarget.user_id == user_id)
        targets = db.exec(statement).all()
        return targets
    except Exception as e:
        print(f"ERROR in get_daily_targets: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch daily targets.")

@app.delete("/api/targets/{target_id}")
def delete_daily_target(
    target_id: int,
    db: DBSession,
    user_id: str = Depends(get_current_user)
):
    """Delete a daily target."""
    try:
        target = db.exec(
            select(DailyTarget)
            .where(DailyTarget.id == target_id)
            .where(DailyTarget.user_id == user_id)
        ).first()
        
        if not target:
            raise HTTPException(status_code=404, detail="Target not found.")
        
        db.delete(target)
        db.commit()
        return {"message": "Target deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in delete_daily_target: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete daily target.")

# === Categories Endpoints ===
@app.get("/api/categories/", response_model=list[Category])
@app.get("/api/categories", response_model=list[Category])
def get_categories(db: DBSession, user_id: str = Depends(get_current_user)):
    """Get all categories for the authenticated user."""
    try:
        statement = select(Category).where(Category.user_id == user_id).order_by(Category.name)
        categories = db.exec(statement).all()
        return categories
    except Exception as e:
        print(f"ERROR in get_categories: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories.")

@app.post("/api/categories", response_model=Category)
def create_category(
    category_data: CategoryCreate,
    db: DBSession,
    user_id: str = Depends(get_current_user)
):
    """Create a new category for the authenticated user."""
    try:
        # Generate a random color for the category
        import random
        colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"]
        new_category = Category(
            name=category_data.name,
            color=random.choice(colors),
            user_id=user_id
        )
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        return new_category
    except Exception as e:
        print(f"ERROR in create_category: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category.")

# === Activity Endpoints ===
@app.post("/api/activities", response_model=LoggedActivity)
def create_activity(activity_data: ActivityCreate, db: DBSession, user_id: str = Depends(get_current_user)):
    activity_dict = activity_data.model_dump(exclude={'target_date'})
    # Parse the date string from the client
    date_to_save = datetime.fromisoformat(activity_data.target_date).date()

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
    user_id: str = Depends(get_current_user),
    target_date: Optional[date] = Query(None, description="Target date for wake-up to wake-up cycle")
):
    """
    Get activities using wake-up to wake-up day cycle logic.
    Returns activities from wake-up on target_date to wake-up on target_date+1.
    If no target_date provided, defaults to today.
    """
    # Use target_date if provided, otherwise default to today
    if target_date is None:
        target_date = date.today()
    
    # Fetch a 4-day window of data to ensure we have enough context
    # This includes the day before target_date to catch sleep that started the previous day
    data_start = target_date - timedelta(days=1)
    data_end = target_date + timedelta(days=2)
    
    # Get all activities in the 4-day window with eager loading
    base_statement = (
        select(LoggedActivity)
        .options(selectinload(LoggedActivity.category_rel))  # Eager load categories
        .where(LoggedActivity.user_id == user_id)
        .where(func.date(LoggedActivity.activity_date) >= data_start)
        .where(func.date(LoggedActivity.activity_date) <= data_end)
        .order_by(LoggedActivity.activity_date.asc(), LoggedActivity.start_time.asc())
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
    
    # The database query already sorts the activities, so no need to sort again.
    
    # Build response with nested category data
    results = []
    for a in filtered_activities:
        category_obj = None
        if a.category_rel is not None:
            category_obj = {
                "id": a.category_rel.id,
                "name": a.category_rel.name,
                "color": a.category_rel.color,
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
def get_dashboard_bootstrap(db: DBSession, user_id: str = Depends(get_current_user)):
    """
    Fetch dashboard data including activities, pie chart, and last end time.
    Uses eager loading for optimal performance.
    """
    try:
        today = date.today()
        three_days_ago = today - timedelta(days=2)

        # 1. Fetch Activities from the last 3 days with eager loading to prevent N+1 queries
        activities_statement = (
            select(LoggedActivity)
            .options(selectinload(LoggedActivity.category_rel))  # Eager load categories
            .where(LoggedActivity.user_id == user_id)
            .where(LoggedActivity.activity_date >= three_days_ago)
            .order_by(LoggedActivity.activity_date.asc(), LoggedActivity.start_time.asc())
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

        pie_chart_data_unsorted = [
            PieChartData(id=cat_id, name=data["name"], duration=data["duration"], color=data["color"])
            for cat_id, data in category_durations.items()
        ]

        # Sort the pie chart data by duration in descending order
        pie_chart_data = sorted(pie_chart_data_unsorted, key=lambda x: x.duration, reverse=True)

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
    except Exception as e:
        print(f"ERROR in get_dashboard_bootstrap: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while fetching dashboard data."
        )





# === Activity Update Endpoint ===
@app.put("/api/activities/{activity_id}", response_model=ActivityReadWithCategory)
def update_activity(
    activity_id: int,
    update_data: ActivityUpdate,
    db: DBSession,
    user_id: str = Depends(get_current_user)
):
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

# === Activity Delete Endpoint ===
@app.delete("/api/activities/{activity_id}", status_code=200)
def delete_activity(
    activity_id: int,
    db: DBSession,
    user_id: str = Depends(get_current_user)
):
    # Fetch the activity from the database
    activity = db.get(LoggedActivity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Verify ownership - critical security check
    if activity.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this activity")
    
    # Delete the activity
    db.delete(activity)
    db.commit()
    
    return {"success": True, "message": "Activity deleted successfully"}