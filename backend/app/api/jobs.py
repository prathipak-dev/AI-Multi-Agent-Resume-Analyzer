"""
Enhanced Jobs API — search, filter, bookmark, and auto-generate application packages.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User, Bookmark, Job
from app.db.repository import JobRepository, BookmarkRepository, ResumeRepository
from app.api.auth import get_current_user
from app.services.jooble_service import jooble_service
from app.services.groq_service import groq_service

router = APIRouter(prefix="/jobs", tags=["Jobs Explorer"])

DOMAINS = ["Full Stack", "Frontend", "Backend", "DevOps", "AI/ML", "Data Science", "Mobile", "Cybersecurity", "Cloud"]

class BookmarkToggle(BaseModel):
    job_id: str

class InterviewPrepRequest(BaseModel):
    job_id: str


def _job_to_dict(job: Job, bookmarked: bool = False) -> dict:
    return {
        "id": job.id,
        "external_id": job.external_id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "salary_range": job.salary_range,
        "job_type": job.job_type,
        "domain": job.domain,
        "description": job.description,
        "extracted_skills": job.extracted_skills or [],
        "experience_level": job.experience_level,
        "source": job.source,
        "created_at": job.created_at,
        "bookmarked": bookmarked
    }


@router.get("/")
async def list_jobs(
    domain: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    experience: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """List and search jobs with optional filters."""
    job_repo = JobRepository(db)
    bookmark_repo = BookmarkRepository(db)

    # Fetch fresh jobs if DB is empty
    existing_jobs = await job_repo.get_all(limit=5)
    if not existing_jobs:
        fetched = await jooble_service.fetch_fresher_jobs(
            keywords=f"{domain or 'Software Engineer'} fresher"
        )
        for item in fetched:
            new_job = await job_repo.get_by_external_id(item["id"])
            if not new_job:
                job_obj = Job(
                    external_id=item["id"],
                    title=item["title"],
                    company=item["company"],
                    location=item["location"],
                    salary_range=item.get("salary_range", ""),
                    job_type=item.get("job_type", "Full-time"),
                    domain=item.get("domain", "Full Stack"),
                    description=item["description"],
                    extracted_skills=item.get("extracted_skills", []),
                    experience_level=item.get("experience_level", "Fresher / 0-2 yrs")
                )
                await job_repo.create(job_obj)

    # Search or list
    if query:
        jobs = await job_repo.search(query, domain=domain, limit=50)
    else:
        jobs = await job_repo.get_all(limit=50, domain=domain)

    # Filter by experience level
    if experience:
        jobs = [j for j in jobs if experience.lower() in (j.experience_level or "").lower()]

    # Get user bookmarks
    user_bookmarks = set()
    if current_user:
        bookmarks = await bookmark_repo.get_by_user(current_user.id)
        user_bookmarks = {b.job_id for b in bookmarks}

    return {
        "jobs": [_job_to_dict(j, j.id in user_bookmarks) for j in jobs],
        "count": len(jobs),
        "filters": {"domain": domain, "query": query, "experience": experience}
    }


@router.get("/bookmarks")
async def get_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bookmarked jobs for the current user."""
    bookmark_repo = BookmarkRepository(db)
    job_repo = JobRepository(db)

    bookmarks = await bookmark_repo.get_by_user(current_user.id)
    result = []
    for bm in bookmarks:
        job = await job_repo.get_by_id(bm.job_id)
        if job:
            result.append({**_job_to_dict(job, True), "bookmarked_at": bm.created_at})

    return {"bookmarks": result, "count": len(result)}


@router.post("/bookmark")
async def toggle_bookmark(
    data: BookmarkToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add or remove a job bookmark."""
    bookmark_repo = BookmarkRepository(db)
    existing = await bookmark_repo.get_by_user_and_job(current_user.id, data.job_id)

    if existing:
        await bookmark_repo.delete(existing)
        return {"bookmarked": False, "message": "Bookmark removed."}

    bm = Bookmark(user_id=current_user.id, job_id=data.job_id)
    await bookmark_repo.create(bm)
    return {"bookmarked": True, "message": "Job saved to bookmarks."}


@router.get("/{job_id}")
async def get_job_detail(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full job details with match indicators for the current user."""
    job_repo = JobRepository(db)
    resume_repo = ResumeRepository(db)
    bookmark_repo = BookmarkRepository(db)

    job = await job_repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    bm = await bookmark_repo.get_by_user_and_job(current_user.id, job_id)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)

    # Compute skill match
    matched_skills = []
    missing_skills = []
    if resume and resume.parsed_skills and job.extracted_skills:
        user_skills = set(s.lower() for s in resume.parsed_skills)
        job_skills = job.extracted_skills or []
        matched_skills = [s for s in job_skills if s.lower() in user_skills]
        missing_skills = [s for s in job_skills if s.lower() not in user_skills]

    return {
        **_job_to_dict(job, bm is not None),
        "skill_match": {
            "matched": matched_skills,
            "missing": missing_skills,
            "score": round(len(matched_skills) / max(len(job.extracted_skills or []), 1) * 100, 1)
        }
    }
