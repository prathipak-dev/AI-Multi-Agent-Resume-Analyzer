import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import init_db
from app.api import auth, resume, jobs, matches, application, advisor, dashboard, career, recruiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MainApp")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    await init_db()
    logger.info("Database initialization complete.")
    yield
    logger.info("Shutting down AI Multi-Agent Career Intelligence Platform backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Startup-grade AI Multi-Agent Career Intelligence Platform powered by LangGraph, FastAPI, and Groq.",
    lifespan=lifespan
)

# CORS Configuration
# In production, set ALLOWED_ORIGINS env var to your Vercel URL (comma-separated).
# Example: ALLOWED_ORIGINS=https://your-app.vercel.app
# Defaults to ["*"] for local development.
_raw_origins = settings.ALLOWED_ORIGINS
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False if "*" in _origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Registrations
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(resume.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(matches.router, prefix=settings.API_V1_STR)
app.include_router(application.router, prefix=settings.API_V1_STR)
app.include_router(advisor.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(career.router, prefix=settings.API_V1_STR)
app.include_router(recruiter.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "framework": "LangGraph Multi-Agent Architecture"
    }
