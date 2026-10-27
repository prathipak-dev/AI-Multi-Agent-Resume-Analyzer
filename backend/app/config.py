import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Automatically load backend/.env or root .env
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Multi-Agent Career Intelligence Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-key-for-hackathon-ai-career-platform-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (PostgreSQL with SQLite fallback)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./ai_career_platform.db"
    )
    
    # AI Services Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    
    # Job APIs
    JOOBLE_API_KEY: str = os.getenv("JOOBLE_API_KEY", "")
    
    # Vector Database & Embeddings
    CHROMADB_PATH: str = os.getenv("CHROMADB_PATH", "./chroma_db")
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Redis Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # CORS: comma-separated list of allowed origins.
    # Leave empty for local dev (defaults to *). Set to your Vercel URL in production.
    # Example: ALLOWED_ORIGINS=https://your-app.vercel.app
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")

    class Config:
        case_sensitive = True

settings = Settings()
