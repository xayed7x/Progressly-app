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
from models import Goal, GoalCreate, LoggedActivity, ActivityCreate

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

origins = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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

    # 1. Get all data from the request model as a dictionary
    activity_dict = activity_data.model_dump()

    # 2. Determine the correct date for overnight activities
    today_date = datetime.utcnow().date()
    
    # Check if this is an overnight activity (end_time < start_time)
    if activity_data.end_time < activity_data.start_time:
        # Overnight activity - save to previous day
        date_to_save = today_date - timedelta(days=1)
    else:
        # Regular activity - save to today
        date_to_save = today_date

    # 3. Create the LoggedActivity object by unpacking the dictionary
    #    and adding the user_id and correct activity_date
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
@app.get("/api/activities", response_model=list[LoggedActivity])
def get_activities(db: DBSession, clerk_session: ClerkSession):
    """
    Fetches activities for the authenticated user that were logged for the current day.
    """
    user_id = clerk_session.payload['sub']
    today = date.today()

    # Build a query that filters by user_id AND today's date.
    # We use func.date() to extract only the date part of the 'activity_date' timestamp.
    statement = (
        select(LoggedActivity)
        .where(LoggedActivity.user_id == user_id)
        .where(func.date(LoggedActivity.activity_date) == today)
        .order_by(LoggedActivity.start_time) # Show activities in chronological order
    )
    
    activities = db.exec(statement).all()
    return activities