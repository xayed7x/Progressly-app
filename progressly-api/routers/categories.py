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
    user_id = clerk_session.payload['sub']
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