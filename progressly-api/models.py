from datetime import datetime, time
from typing import Optional
from sqlmodel import Field, SQLModel

# --- Goal Models (Existing) ---

class GoalBase(SQLModel):
    content: str

class Goal(GoalBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class GoalCreate(GoalBase):
    pass


# --- Activity Models (Updated) ---

class LoggedActivityBase(SQLModel):
    activity_name: str
    start_time: time
    end_time: time
    category: Optional[str] = Field(default=None, index=True) # <-- ADD THIS LINE

class LoggedActivity(LoggedActivityBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    activity_date: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    # The 'category' field is inherited from LoggedActivityBase, so no change is needed here.

class ActivityCreate(LoggedActivityBase):
    # This class also inherits the new 'category' field automatically.
    pass