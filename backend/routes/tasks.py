from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from models import Task, TaskCreate, TaskUpdate
from database import get_tasks_collection, get_history_collection, get_notifications_collection
from auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("", response_model=List[Task])
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    project_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all tasks with optional filters"""
    tasks_collection = await get_tasks_collection()
    
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if project_id:
        query["project_id"] = project_id
    
    tasks = await tasks_collection.find(query).to_list(1000)
    return tasks

@router.post("", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new task"""
    tasks_collection = await get_tasks_collection()
    history_collection = await get_history_collection()
    notifications_collection = await get_notifications_collection()
    
    # Get next ID
    last_task = await tasks_collection.find_one(sort=[("id", -1)])
    next_id = (last_task["id"] + 1) if last_task else 1
    
    # Create task
    now = datetime.utcnow().isoformat()
    task_dict = task.model_dump()
    task_dict.update({
        "id": next_id,
        "actual_hours": 0.0,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    })
    
    await tasks_collection.insert_one(task_dict)
    
    # Add history
    await history_collection.insert_one({
        "id": await get_next_history_id(history_collection),
        "task_id": next_id,
        "user_id": current_user["id"],
        "action": "CREATED",
        "old_value": "",
        "new_value": task.title,
        "timestamp": now
    })
    
    # Add notification if assigned
    if task.assigned_to > 0:
        await notifications_collection.insert_one({
            "id": await get_next_notification_id(notifications_collection),
            "user_id": task.assigned_to,
            "message": f"Nueva tarea asignada: {task.title}",
            "type": "task_assigned",
            "read": False,
            "created_at": now
        })
    
    return task_dict

@router.get("/{task_id}", response_model=Task)
async def get_task(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific task by ID"""
    tasks_collection = await get_tasks_collection()
    task = await tasks_collection.find_one({"id": task_id})
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task

@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a task"""
    tasks_collection = await get_tasks_collection()
    history_collection = await get_history_collection()
    notifications_collection = await get_notifications_collection()
    
    # Get old task
    old_task = await tasks_collection.find_one({"id": task_id})
    if not old_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update task
    now = datetime.utcnow().isoformat()
    task_dict = task_update.model_dump()
    task_dict.update({
        "id": task_id,
        "actual_hours": old_task.get("actual_hours", 0.0),
        "created_by": old_task["created_by"],
        "created_at": old_task["created_at"],
        "updated_at": now
    })
    
    await tasks_collection.replace_one({"id": task_id}, task_dict)
    
    # Add history for status change
    if old_task["status"] != task_update.status:
        await history_collection.insert_one({
            "id": await get_next_history_id(history_collection),
            "task_id": task_id,
            "user_id": current_user["id"],
            "action": "STATUS_CHANGED",
            "old_value": old_task["status"],
            "new_value": task_update.status,
            "timestamp": now
        })
    
    # Add history for title change
    if old_task["title"] != task_update.title:
        await history_collection.insert_one({
            "id": await get_next_history_id(history_collection),
            "task_id": task_id,
            "user_id": current_user["id"],
            "action": "TITLE_CHANGED",
            "old_value": old_task["title"],
            "new_value": task_update.title,
            "timestamp": now
        })
    
    # Add notification if assigned
    if task_update.assigned_to > 0:
        await notifications_collection.insert_one({
            "id": await get_next_notification_id(notifications_collection),
            "user_id": task_update.assigned_to,
            "message": f"Tarea actualizada: {task_update.title}",
            "type": "task_updated",
            "read": False,
            "created_at": now
        })
    
    return task_dict

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a task"""
    tasks_collection = await get_tasks_collection()
    history_collection = await get_history_collection()
    
    # Get task
    task = await tasks_collection.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Add history
    await history_collection.insert_one({
        "id": await get_next_history_id(history_collection),
        "task_id": task_id,
        "user_id": current_user["id"],
        "action": "DELETED",
        "old_value": task["title"],
        "new_value": "",
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Delete task
    await tasks_collection.delete_one({"id": task_id})
    
    return None

# Helper functions
async def get_next_history_id(collection):
    last = await collection.find_one(sort=[("id", -1)])
    return (last["id"] + 1) if last else 1

async def get_next_notification_id(collection):
    last = await collection.find_one(sort=[("id", -1)])
    return (last["id"] + 1) if last else 1
