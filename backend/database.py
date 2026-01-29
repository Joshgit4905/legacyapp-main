import ssl
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

class Database:
    client: AsyncIOMotorClient = None
    
db = Database()

async def get_database():
    return db.client["taskmanager"]

async def connect_to_mongo():
    """Connect to MongoDB"""
    db.client = AsyncIOMotorClient(
        settings.mongodb_uri,
        tls=True,
        tlsCAFile=certifi.where()
    )
    print("✅ Connected to MongoDB")

async def close_mongo_connection():
    """Close MongoDB connection"""
    db.client.close()
    print("❌ Closed MongoDB connection")

# Collection getters
async def get_users_collection():
    database = await get_database()
    return database.users

async def get_tasks_collection():
    database = await get_database()
    return database.tasks

async def get_projects_collection():
    database = await get_database()
    return database.projects

async def get_comments_collection():
    database = await get_database()
    return database.comments

async def get_history_collection():
    database = await get_database()
    return database.history

async def get_notifications_collection():
    database = await get_database()
    return database.notifications
