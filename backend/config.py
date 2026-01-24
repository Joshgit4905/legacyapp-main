from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb+srv://jrc4905:1234@ma2025.lxjra0n.mongodb.net/"
    jwt_secret: str = "your-secret-key-change-this"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
