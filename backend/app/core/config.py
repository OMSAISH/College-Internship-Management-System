import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "College Internship Management System (CIMS)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Secret Key for JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cims-super-secure-production-ready-jwt-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database URL: default to SQLite file for instant friction-free development/testing, or PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cims.db")
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]
    
    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.abspath("./uploads"))
    MAX_UPLOAD_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: List[str] = ["pdf"]
    
    # Admin Seed
    FIRST_SUPERUSER: str = os.getenv("FIRST_SUPERUSER", "admin@demo.local")
    FIRST_SUPERUSER_PASSWORD: str = os.getenv("FIRST_SUPERUSER_PASSWORD", "Admin@1234")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
