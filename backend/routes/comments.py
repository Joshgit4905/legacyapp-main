from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime
from models import Comment, CommentCreate
from database import get_comments_collection
from auth import get_current_user

router = APIRouter(prefix="/api/comments", tags=["comments"])

@router.get("/{task_id}", response_model=List[Comment])
async def get_comments(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all comments for a task"""
    comments_collection = await get_comments_collection()
    comments = await comments_collection.find({"task_id": task_id}).to_list(1000)
    return comments

@router.post("", response_model=Comment, status_code=201)
async def create_comment(
    comment: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a task"""
    comments_collection = await get_comments_collection()
    
    # Get next ID
    last_comment = await comments_collection.find_one(sort=[("id", -1)])
    next_id = (last_comment["id"] + 1) if last_comment else 1
    
    # Create comment
    comment_dict = comment.model_dump()
    comment_dict.update({
        "id": next_id,
        "user_id": current_user["id"],
        "created_at": datetime.utcnow().isoformat()
    })
    
    await comments_collection.insert_one(comment_dict)
    
    return comment_dict
