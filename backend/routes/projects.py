from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import Project, ProjectCreate, ProjectUpdate
from database import get_projects_collection
from auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=List[Project])
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Get all projects"""
    projects_collection = await get_projects_collection()
    projects = await projects_collection.find().to_list(1000)
    return projects

@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new project"""
    projects_collection = await get_projects_collection()
    
    # Get next ID
    last_project = await projects_collection.find_one(sort=[("id", -1)])
    next_id = (last_project["id"] + 1) if last_project else 1
    
    # Create project
    project_dict = project.model_dump()
    project_dict["id"] = next_id
    
    await projects_collection.insert_one(project_dict)
    
    return project_dict

@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a project"""
    projects_collection = await get_projects_collection()
    
    # Check if project exists
    existing = await projects_collection.find_one({"id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update project
    project_dict = project_update.model_dump()
    project_dict["id"] = project_id
    
    await projects_collection.replace_one({"id": project_id}, project_dict)
    
    return project_dict

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete a project"""
    projects_collection = await get_projects_collection()
    
    # Check if project exists
    existing = await projects_collection.find_one({"id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete project
    await projects_collection.delete_one({"id": project_id})
    
    return None
