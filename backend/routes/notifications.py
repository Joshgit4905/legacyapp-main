from fastapi import APIRouter, Depends
from typing import List
from models import Notification
from database import get_notifications_collection
from auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("", response_model=List[Notification])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get all notifications for current user"""
    notifications_collection = await get_notifications_collection()
    notifications = await notifications_collection.find({
        "user_id": current_user["id"]
    }).sort("created_at", -1).to_list(1000)
    return notifications

@router.put("/read")
async def mark_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read for current user"""
    notifications_collection = await get_notifications_collection()
    
    await notifications_collection.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notifications marked as read"}
