# progressly-api/routers/categories.py (Corrected Version)
from typing import List, Annotated
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
import os
import httpx

# NOTE: The dependencies below are duplicated from main.py.
# In the future, we should move these to a shared `deps.py` file.
# For now, this ensures this router works with your existing setup.
from database import get_session
from models import Category, CategoryCreate, CategoryRead, CategoryUpdate, LoggedActivity
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions, RequestState

clerk = Clerk(bearer_auth=os.environ.get("CLERK_SECRET_KEY"))

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

DBSession = Annotated[Session, Depends(get_session)]
ClerkSession = Annotated[RequestState, Depends(get_session_details)]


router = APIRouter(
    prefix="/api/categories",
    tags=["categories"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[CategoryRead])
def get_user_categories(db: DBSession, clerk_session: ClerkSession):
    # Get the User ID from the authenticated Clerk session
    user_id = clerk_session.payload['sub']
    
    # Check for Existing Defaults: Query to check if any categories exist for this user_id where is_default=True
    existing_defaults = db.exec(
        select(Category).where(Category.user_id == user_id, Category.is_default == True)
    ).all()
    
    # The Critical if Statement: If no defaults exist, trigger seeding logic
    if not existing_defaults:
        # Create the 13 default category objects in memory
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
        
        # Add all 13 of these new objects to the database session and commit
        for cat_data in default_categories_data:
            new_category = Category(
                name=cat_data["name"], 
                color=cat_data["color"], 
                user_id=user_id, 
                is_default=True
            )
            db.add(new_category)
        
        db.commit()
    
    # Return the Complete List: Fetch the user's complete list (defaults + custom) and return
    user_categories = db.exec(
        select(Category).where(Category.user_id == user_id)
    ).all()
    return user_categories

@router.post("", response_model=CategoryRead)
def create_category(category: CategoryCreate, db: DBSession, clerk_session: ClerkSession):
    user_id = clerk_session.payload['sub']
    existing_category = db.exec(
        select(Category).where(Category.user_id == user_id, Category.name.ilike(category.name))
    ).first()

    if existing_category:
        raise HTTPException(status_code=409, detail="A category with this name already exists.")

    db_category = Category.from_orm(category, {"user_id": user_id, "is_default": False})
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.put("/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, category_update: CategoryUpdate, db: DBSession, clerk_session: ClerkSession):
    user_id = clerk_session.payload['sub']
    db_category = db.get(Category, category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    if db_category.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this category")
    if db_category.is_default:
        raise HTTPException(status_code=400, detail="Default categories cannot be modified.")

    category_data = category_update.dict(exclude_unset=True)
    for key, value in category_data.items():
        setattr(db_category, key, value)

    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: DBSession, clerk_session: ClerkSession):
    user_id = clerk_session.payload['sub']
    category_to_delete = db.get(Category, category_id)
    if not category_to_delete:
        raise HTTPException(status_code=404, detail="Category not found")
    if category_to_delete.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this category")
    if category_to_delete.is_default:
        raise HTTPException(status_code=400, detail="Default categories cannot be deleted.")
    
    linked_activities = db.exec(select(LoggedActivity).where(LoggedActivity.category_id == category_id)).first()
    if linked_activities:
         raise HTTPException(status_code=400, detail="Cannot delete category as it is currently in use by logged activities.")

    db.delete(category_to_delete)
    db.commit()
    return {"ok": True}