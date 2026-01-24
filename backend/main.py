from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import APIRouter, Depends, HTTPException, status
from contextlib import asynccontextmanager

from config import settings
from database import connect_to_mongo, close_mongo_connection, get_users_collection
from auth import verify_password, create_access_token, get_password_hash
from models import UserLogin, Token

# Import routes
from routes import tasks, projects, comments, history, notifications, users

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    await initialize_default_data()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Task Manager API",
    description="Modern task management system with MongoDB",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

@auth_router.post("/login", response_model=Token)
async def login(user_login: UserLogin):
    """Login endpoint"""
    users_collection = await get_users_collection()
    
    # Find user
    user = await users_collection.find_one({"username": user_login.username})
    
    if not user or not verify_password(user_login.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"]}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Include routers
app.include_router(auth_router)
app.include_router(tasks.router)
app.include_router(projects.router)
app.include_router(comments.router)
app.include_router(history.router)
app.include_router(notifications.router)
app.include_router(users.router)

# Serve static files (frontend)
app.mount("/", StaticFiles(directory="../", html=True), name="static")

from database import get_projects_collection

async def initialize_default_data():
    """Initialize database with default data"""
    users_collection = await get_users_collection()
    projects_collection = await get_projects_collection()
    
    # Check if data already exists
    user_count = await users_collection.count_documents({})
    if user_count > 0:
        print("✅ Database already initialized")
        return
    
    print("🔧 Initializing default data...")
    
    # Create admin user only
    admin_user = {"id": 1, "username": "admin", "hashed_password": get_password_hash("admin")}
    await users_collection.insert_one(admin_user)
    
    print("✅ Default data initialized (Admin user created)")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0.0"}
