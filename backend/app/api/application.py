"""
Career Automation — Application tracking, notes, status updates, and cover letter/email generation.
"""
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User, Application, ApplicationNote
from app.db.repository import ResumeRepository, ApplicationRepository, JobRepository, CareerGoalRepository
from app.api.auth import get_current_user
from app.agents.personalized_application import personalized_application_agent
from app.agents.state import AgentState
from app.services.groq_service import groq_service

router = APIRouter(prefix="/application", tags=["Career Automation"])


class ApplicationGenerateRequest(BaseModel):
    job_id: str


class StatusUpdate(BaseModel):
    application_id: str
    status: str  # Draft, Applied, Interview, Offer, Rejected


class NoteAdd(BaseModel):
    application_id: str
    note: str
    interview_date: Optional[str] = None


class InterviewPrepRequest(BaseModel):
    application_id: str


@router.post("/generate")
async def generate_application_package(
    req: ApplicationGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate tailored resume + cover letter + HR email for a specific job."""
    resume_repo = ResumeRepository(db)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)
    if not resume:
        raise HTTPException(status_code=400, detail="Please upload a resume first.")

    job_repo = JobRepository(db)
    job = await job_repo.get_by_id(req.job_id) or await job_repo.get_by_external_id(req.job_id)

    job_data = {
        "title": job.title if job else "Software Engineer",
        "company": job.company if job else "Tech Startup",
        "description": job.description if job else "Building modern SaaS applications."
    }

    state: AgentState = {
        "user_id": current_user.id,
        "raw_text": resume.raw_text,
        "parsed_skills": resume.parsed_skills or [],
        "matched_jobs": [job_data]
    }

    res_state = await personalized_application_agent.run(state)

    app_repo = ApplicationRepository(db)
    new_app = Application(
        user_id=current_user.id,
        job_id=job.id if job else req.job_id,
        tailored_resume=res_state.get("tailored_resume", ""),
        cover_letter=res_state.get("cover_letter", ""),
        hr_email=res_state.get("hr_email", ""),
        status="Draft"
    )
    saved_app = await app_repo.create(new_app)

    return {
        "id": saved_app.id,
        "job_id": req.job_id,
        "job_title": job_data["title"],
        "company": job_data["company"],
        "tailored_resume": saved_app.tailored_resume,
        "cover_letter": saved_app.cover_letter,
        "hr_email": saved_app.hr_email,
        "status": saved_app.status,
        "created_at": saved_app.created_at
    }


@router.get("/tracker")
async def get_application_tracker(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all applications with job details and status."""
    app_repo = ApplicationRepository(db)
    job_repo = JobRepository(db)

    apps = await app_repo.get_by_user_id(current_user.id)
    result = []
    for app in apps:
        job = await job_repo.get_by_id(app.job_id)
        result.append({
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "Unknown",
            "company": job.company if job else "Unknown",
            "location": job.location if job else "",
            "status": app.status,
            "cover_letter_preview": (app.cover_letter or "")[:200],
            "created_at": app.created_at,
            "has_cover_letter": bool(app.cover_letter),
            "has_tailored_resume": bool(app.tailored_resume),
            "has_hr_email": bool(app.hr_email)
        })

    # Status summary
    statuses = {}
    for a in result:
        statuses[a["status"]] = statuses.get(a["status"], 0) + 1

    return {
        "applications": result,
        "count": len(result),
        "summary": statuses
    }


@router.get("/{app_id}")
async def get_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full application package details."""
    app_repo = ApplicationRepository(db)
    job_repo = JobRepository(db)

    app = await app_repo.get_by_id(app_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found.")

    job = await job_repo.get_by_id(app.job_id)

    return {
        "id": app.id,
        "job_id": app.job_id,
        "job_title": job.title if job else "Unknown",
        "company": job.company if job else "Unknown",
        "location": job.location if job else "",
        "job_description": job.description if job else "",
        "tailored_resume": app.tailored_resume,
        "cover_letter": app.cover_letter,
        "hr_email": app.hr_email,
        "status": app.status,
        "created_at": app.created_at
    }


@router.patch("/status")
async def update_status(
    data: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the status of an application (Applied, Interview, Offer, Rejected)."""
    valid_statuses = ["Draft", "Applied", "Interview", "Offer", "Rejected"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")

    app_repo = ApplicationRepository(db)
    app = await app_repo.get_by_id(data.application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found.")

    updated = await app_repo.update_status(data.application_id, data.status)
    return {"success": True, "status": updated.status}


@router.post("/interview-prep")
async def get_interview_questions(
    data: InterviewPrepRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate interview questions for a specific applied job."""
    app_repo = ApplicationRepository(db)
    job_repo = JobRepository(db)
    resume_repo = ResumeRepository(db)

    app = await app_repo.get_by_id(data.application_id)
    if not app or app.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Application not found.")

    job = await job_repo.get_by_id(app.job_id)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)

    job_title = job.title if job else "Software Engineer"
    company = job.company if job else "the company"
    jd_snippet = (job.description or "")[:1500] if job else ""
    skills = ", ".join((resume.parsed_skills or [])[:15]) if resume else ""

    prompt = f"""
Generate 6 targeted interview questions for this specific job application.

Role: {job_title} at {company}
Job Description: {jd_snippet}
Candidate Skills: {skills}

Mix:
- 2 technical questions from the JD requirements
- 2 company/role-fit behavioral questions
- 1 system design / scenario question
- 1 "why this company/role" motivation question

Return JSON:
{{
  "questions": [
    {{
      "question": "...",
      "category": "Technical|Behavioral|System Design|Motivation",
      "difficulty": "Easy|Medium|Hard",
      "hint": "key points to cover"
    }}
  ],
  "preparation_tips": ["tip1", "tip2", "tip3"]
}}
"""

    result = await groq_service.generate_json(
        prompt,
        system_prompt="You are an expert interview coach. Generate specific questions based on the actual JD and candidate skills.",
        max_tokens=1000
    )

    return {
        "job_title": job_title,
        "company": company,
        "questions": result.get("questions", []),
        "preparation_tips": result.get("preparation_tips", [])
    }
