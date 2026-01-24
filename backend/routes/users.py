from fastapi import APIRouter, Depends
from typing import List
from models import User
from database import get_users_collection
from auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    """Get all users (for assignment dropdowns)"""
    users_collection = await get_users_collection()
    users = await users_collection.find({}, {"hashed_password": 0}).to_list(1000)
    return users
