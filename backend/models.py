from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# User Models
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

# Task Models
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = ""
    status: str = "Pendiente"
    priority: str = "Media"
    project_id: int = 0
    assigned_to: int = 0
    due_date: Optional[str] = ""
    estimated_hours: float = 0.0

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    actual_hours: float = 0.0
    created_by: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

# Project Models
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    
    class Config:
        from_attributes = True

# Comment Models
class CommentBase(BaseModel):
    task_id: int
    comment_text: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    user_id: int
    created_at: str
    
    class Config:
        from_attributes = True

# History Models
class HistoryBase(BaseModel):
    task_id: int
    action: str
    old_value: str = ""
    new_value: str = ""

class HistoryCreate(HistoryBase):
    pass

class History(HistoryBase):
    id: int
    user_id: int
    timestamp: str
    
    class Config:
        from_attributes = True

# Notification Models
class NotificationBase(BaseModel):
    message: str
    type: str

class NotificationCreate(NotificationBase):
    user_id: int

class Notification(NotificationBase):
    id: int
    user_id: int
    read: bool = False
    created_at: str
    
    class Config:
        from_attributes = True

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
