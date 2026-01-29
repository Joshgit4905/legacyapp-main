from fastapi import APIRouter, Depends
from typing import List, Optional
from models import History
from database import get_history_collection
from auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("/{task_id}", response_model=List[History])
async def get_task_history(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get history for a specific task"""
    history_collection = await get_history_collection()
    history = await history_collection.find({"task_id": task_id}).to_list(1000)
    return history

@router.get("", response_model=List[History])
async def get_all_history(
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get all history (limited to last 100 by default)"""
    history_collection = await get_history_collection()
    history = await history_collection.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return history
