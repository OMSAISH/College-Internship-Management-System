import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sanjivani University - College Internship Management System (CIMS)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment mode: 'development', 'staging', 'production'
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Secret Key for JWT Access Tokens (HS256)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cims-super-secure-production-jwt-access-secret-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Refresh Token Secret & Expiry
    JWT_REFRESH_SECRET: str = os.getenv("JWT_REFRESH_SECRET", "cims-super-secure-production-jwt-refresh-secret-2026")
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    
    # 2FA Temporary Ticket Expiry (minutes)
    MFA_TICKET_EXPIRE_MINUTES: int = 5
    
    # TOTP Encryption Key (Fernet 32-byte urlsafe base64 string)
    TOTP_ENCRYPTION_KEY: str = os.getenv("TOTP_ENCRYPTION_KEY", "1JEagI9K_VZ85R4NLCawX9oN_wWzYDHcyF8KO33e9Hs=")
    
    # Database URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cims.db")
    
    # Frontend Base URL (for verification & password reset links)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Email Delivery Configuration
    EMAIL_PROVIDER: str = os.getenv("EMAIL_PROVIDER", "console")  # 'smtp', 'resend', 'console'
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "true").lower() == "true"
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "omsaish.dhokchaule24@sanjivani.edu.in")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "Mr. Omsaish Dhokchaule - Sanjivani University TPO")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    
    # Security Policies & Brute Force Lockout
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    
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
    
    # Default initial admin email for institutional provisioning
    INITIAL_ADMIN_EMAIL: str = os.getenv("INITIAL_ADMIN_EMAIL", "tpo@sanjivani.edu.in")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
