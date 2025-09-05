# progressly-api/models.py
from datetime import datetime, time
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

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
    id: Optional[int] = Field(default=None, primary_key=True)
    is_default: bool = Field(default=False)
    user_id: str = Field(index=True)

    # Relationship: One category can have many activities.
    # 'back_populates' links this to the 'category_rel' field in LoggedActivity.
    activities: List["LoggedActivity"] = Relationship(back_populates="category_rel")

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: int
    is_default: bool

class CategoryUpdate(SQLModel):
    name: Optional[str] = None
    color: Optional[str] = None


# --- UPDATED Activity Models ---
# We are modifying these to link to the new Category table.

class LoggedActivityBase(SQLModel):
    activity_name: str
    start_time: time
    end_time: time
    # This is the OLD category field. It is preserved here for data migration.
    # We will stop using it for new activities soon.
    category: Optional[str] = Field(default=None, index=True)

class LoggedActivity(LoggedActivityBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    activity_date: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # NEW: This is the foreign key that links this activity to a specific category.
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")

    # NEW: This is the relationship link that lets us access the full Category object.
    # 'back_populates' links this to the 'activities' field in Category.
    category_rel: Optional[Category] = Relationship(back_populates="activities")

# NEW: We are replacing the old ActivityCreate with a more explicit version
# that uses the new category_id.
class ActivityCreate(SQLModel):
    activity_name: str
    start_time: time
    end_time: time
    category_id: Optional[int] = None

# NEW: API Read models to handle sending nested category data to the frontend.
class ActivityRead(LoggedActivityBase):
    id: int
    user_id: str
    activity_date: datetime
    category_id: Optional[int]

class ActivityReadWithCategory(ActivityRead):
    category: Optional[CategoryRead] = None