import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta # 1. Import 'date', 'datetime', and 'timedelta'
from fastapi import FastAPI, Depends, HTTPException, Request
from sqlmodel import SQLModel, Session, select
from sqlalchemy import func # 2. Import 'func'
from typing import Annotated
import httpx
from fastapi.middleware.cors import CORSMiddleware

from clerk_backend_api import Clerk
from clerk_backend_api.security import authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions, RequestState

from database import engine, get_session
from models import Goal, GoalCreate, LoggedActivity, ActivityCreate, Category

from routers import categories
from models import ActivityReadWithCategory

clerk = Clerk(bearer_auth=os.environ.get("CLERK_SECRET_KEY"))

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

DBSession = Annotated[Session, Depends(get_session)]

async def get_session_details(req: Request) -> RequestState:
    try:
        headers = [(k, v) for k, v in req.headers.items()]
        url = str(req.url)
        content = b""
        httpx_request = httpx.Request(method=req.method, url=url, headers=headers, content=content)
        request_state = clerk.authenticate_request(httpx_request, AuthenticateRequestOptions())
        if not request_state.is_signed_in:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return request_state
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

ClerkSession = Annotated[RequestState, Depends(get_session_details)]

# === Root & Goal Endpoints (No change) ===
@app.get("/")
def read_root(): return {"message": "Welcome to the Progressly API!"}

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

    # This logic correctly determines the date based on start/end times
    if activity_data.end_time < activity_data.start_time:
        date_to_save = today_date - timedelta(days=1)
    else:
        date_to_save = today_date

    # The new ActivityCreate model sends category_id, which is handled correctly here.
    new_activity = LoggedActivity(
        **activity_dict,
        user_id=user_id,
        activity_date=date_to_save
    )

    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)
    return new_activity

# 3. === The New GET Activities Endpoint ===
@app.get("/api/activities", response_model=list[ActivityReadWithCategory])
def get_activities(db: DBSession, clerk_session: ClerkSession):
    """
    Fetches activities for the authenticated user for the current day,
    including the nested category data for each activity.
    """
    user_id = clerk_session.payload['sub']
    today = date.today()

    statement = (
        select(LoggedActivity)
        .where(LoggedActivity.user_id == user_id)
        .where(func.date(LoggedActivity.activity_date) == today)
        .order_by(LoggedActivity.start_time)
    )
    
    activities = db.exec(statement).all()

    # Map ORM objects to the response schema including nested category data
    results = []
    for a in activities:
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




@app.post("/api/users/seed-defaults", status_code=201)
def seed_default_categories(db: DBSession, clerk_session: ClerkSession):
    """
    A one-time endpoint to create the default categories for the authenticated user.
    This endpoint is idempotent: it will not create duplicates if run again.
    """
    user_id = clerk_session.payload['sub']

    # 1. Check if the user already has default categories.
    existing_defaults = db.exec(
        select(Category).where(Category.user_id == user_id, Category.is_default == True)
    ).first()

    if existing_defaults:
        return {"message": "Default categories already exist for this user."}

    # 2. Define the list of default categories.
    default_categories_data = [
        {"name": "Work", "color": "#3b82f6"},
        {"name": "Study", "color": "#22c55e"},
        {"name": "Skill Development", "color": "#14b8a6"},
        {"name": "Spiritual & Faith", "color": "#f59e0b"},
        {"name": "Health & Fitness", "color": "#ef4444"},
        {"name": "Personal Time", "color": "#8b5cf6"},
        {"name": "Family & Social", "color": "#eab308"},
        {"name": "Social Media", "color": "#ec4899"},
        {"name": "Leisure & Hobbies", "color": "#06b6d4"},
        {"name": "Eating & Nutrition", "color": "#f97316"},
        {"name": "Transportation", "color": "#64748b"},
        {"name": "Home & Chores", "color": "#78716c"},
        {"name": "Sleep", "color": "#4f46e5"},
    ]

    # 3. Create and add the new category objects to the database.
    for cat_data in default_categories_data:
        new_category = Category(
            name=cat_data["name"],
            color=cat_data["color"],
            user_id=user_id,
            is_default=True
        )
        db.add(new_category)
    
    db.commit()

    return {"message": f"Successfully created {len(default_categories_data)} default categories."}