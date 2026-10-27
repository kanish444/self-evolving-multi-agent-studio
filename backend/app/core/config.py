import os
from pydantic_settings import BaseSettings
from typing import Optional

# Absolute path to sqlite file inside backend/ directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "se_maestro.db")

class Settings(BaseSettings):
    PROJECT_NAME: str = "SE-MAESTRO"
    API_V1_STR: str = "/api"
    
    # Database Configuration - defaults to SQLite for local development
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    
    # AI Gateway Configuration
    AI_PROVIDER: str = "gemini"
    AI_MODEL: str = ""
    GEMINI_API_KEY: Optional[str] = None
    AI_TEMPERATURE: float = 0.2
    AI_MAX_TOKENS: int = 65536
    AI_TIMEOUT: float = 180.0
    AI_RETRY_COUNT: int = 3
    LIVE_PYTHON_IMAGE: str = "python:3.12-slim"
    LIVE_NODE_IMAGE: str = "node:22-slim"
    
    class Config:
        env_file = os.path.join(BASE_DIR, ".env")
        case_sensitive = True
        extra = "ignore"

settings = Settings()

