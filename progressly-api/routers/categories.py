from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, SQLModel
from sqlalchemy.exc import IntegrityError # Important for handling duplicates
import random

from database import get_session
from dependencies import get_current_user
from models import Category

router = APIRouter()

# --- Pydantic Models for API Data ---

class CategoryCreate(SQLModel):
    name: str
    color: Optional[str] = None

class CategoryUpdate(SQLModel):
    name: Optional[str] = None
    color: Optional[str] = None

# --- API Endpoints ---

@router.get("/", response_model=List[Category])
def get_user_categories(
    *,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    """Fetch all categories for the authenticated user."""
    categories = session.exec(
        select(Category).where(Category.user_id == user_id).order_by(Category.name)
    ).all()
    return categories

@router.post("/", response_model=Category)
def create_user_category(
    *,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
    category: CategoryCreate
):
    """Create a new category for the authenticated user."""
    
    # Check if category with the same name (case-insensitive) already exists
    existing_category = session.exec(
        select(Category).where(
            Category.user_id == user_id,
            Category.name.ilike(category.name) # ilike for case-insensitive search
        )
    ).first()

    if existing_category:
        return existing_category # If it exists, just return it without error

    # Generate a random color if not provided
    if not category.color:
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
                  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
                  '#FF8C94', '#A8DADC', '#E63946']
        category.color = random.choice(colors)
    
    db_category = Category.from_orm(category, update={'user_id': user_id})
    
    try:
        session.add(db_category)
        session.commit()
        session.refresh(db_category)
        return db_category
    except IntegrityError:
        # This is a fallback in case of a race condition
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name already exists.",
        )

@router.put("/{category_id}", response_model=Category)
def update_category(
    *,
    category_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user),
    category_update: CategoryUpdate
):
    """Update an existing category."""
    category = session.get(Category, category_id)
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update fields if provided
    if category_update.name is not None:
        category.name = category_update.name
    if category_update.color is not None:
        category.color = category_update.color
    
    try:
        session.add(category)
        session.commit()
        session.refresh(category)
        return category
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A category with this name already exists.",
        )

@router.delete("/{category_id}")
def delete_category(
    *,
    category_id: int,
    session: Session = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    """Delete a category. Activities with this category will become uncategorized."""
    category = session.get(Category, category_id)
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if category.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Note: Activities with this category_id will have NULL category after delete
    # This is handled by the database foreign key (SET NULL or no action)
    session.delete(category)
    session.commit()
    
    return {"success": True, "message": f"Category '{category.name}' deleted"}