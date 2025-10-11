# progressly-api/models.py
from datetime import datetime, time
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import UniqueConstraint

# --- Goal Models (Existing and Unchanged) ---

class GoalBase(SQLModel):
    content: str

class Goal(GoalBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class GoalCreate(GoalBase):
    pass


# --- NEW Category Models ---
# These models define the new 'categories' table and its API schemas.

class CategoryBase(SQLModel):
    name: str
    color: str # We will store a hex code, e.g., "#FF5733"

class Category(CategoryBase, table=True):
    __table_args__ = (
        # This ensures a user cannot have two categories with the same name
        UniqueConstraint("user_id", "name", name="unique_user_category_name"),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str

    # Relationship: One category can have many activities.
    # 'back_populates' links this to the 'category_rel' field in LoggedActivity.
    activities: List["LoggedActivity"] = Relationship(back_populates="category_rel")

class CategoryCreate(SQLModel):
    name: str

class CategoryRead(SQLModel):
    id: int
    name: str

class CategoryUpdate(SQLModel):
    name: Optional[str] = None


# --- UPDATED Activity Models ---
# We are modifying these to link to the new Category table.

class LoggedActivityBase(SQLModel):
    activity_name: str
    start_time: time
    end_time: time

class LoggedActivity(LoggedActivityBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    activity_date: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # NEW: This is the foreign key that links this activity to a specific category.
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")

    # NEW: This is the relationship link that lets us access the full Category object.
    # 'back_populates' links this to the 'activities' field in Category.
    category_rel: Optional["Category"] = Relationship(back_populates="activities")

# NEW: We are replacing the old ActivityCreate with a more explicit version
# that uses the new category_id.
class ActivityCreate(SQLModel):
    activity_name: str
    start_time: time
    end_time: time
    category_id: Optional[int] = None
    target_date: str # New field for client-provided date

# NEW: API Read models to handle sending nested category data to the frontend.
class ActivityRead(LoggedActivityBase):
    id: int
    user_id: str
    activity_date: datetime  # Include activity_date for frontend
    category_id: Optional[int]

class ActivityReadWithCategory(ActivityRead):
    category: Optional[Category] = None

class ActivityUpdate(SQLModel):
    activity_name: str
    start_time: time
    end_time: time
    category_id: int


# --- Daily Target Models ---
# These models define the 'daily_targets' table for user-defined daily time allocation goals.

class DailyTarget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    category_name: str
    target_hours: float


# --- Chat Models ---
from uuid import UUID, uuid4

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations" # Explicitly set table name for Supabase
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    messages: List["Message"] = Relationship(back_populates="conversation")

class Message(SQLModel, table=True):
    __tablename__ = "messages" # Explicitly set table name for Supabase
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id")
    user_id: UUID
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    conversation: Optional[Conversation] = Relationship(back_populates="messages")
