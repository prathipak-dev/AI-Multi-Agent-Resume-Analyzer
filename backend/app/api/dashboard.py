from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import User
from app.db.repository import ResumeRepository, MatchRepository, ApplicationRepository, JobRepository
from app.api.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics"])

@router.get("/metrics")
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume_repo = ResumeRepository(db)
    match_repo = MatchRepository(db)
    app_repo = ApplicationRepository(db)
    job_repo = JobRepository(db)

    resume = await resume_repo.get_latest_by_user_id(current_user.id)
    matches = await match_repo.get_user_matches(current_user.id, limit=20)
    apps = await app_repo.get_by_user_id(current_user.id)
    jobs = await job_repo.get_all(limit=100)

    avg_match_score = round(sum(m.overall_match_score for m in matches) / len(matches), 1) if matches else None
    top_matches_count = len([m for m in matches if m.overall_match_score >= 80.0])

    return {
        "user": {
            "full_name": current_user.full_name,
            "target_role": current_user.target_role,
            "has_resume": resume is not None
        },
        "stats": {
            "jobs_discovered": len(jobs),
            "top_matches_count": top_matches_count,
            "avg_match_score": avg_match_score,
            "ats_score": resume.ats_score if resume else None,
            "resume_score": resume.resume_score if resume else None,
            "applications_generated": len(apps),
            "target_domain": resume.target_domain if resume else None
        },
        "parsed_skills": resume.parsed_skills if resume else [],
        "recent_applications": [
            {
                "id": a.id,
                "job_id": a.job_id,
                "status": a.status,
                "created_at": a.created_at
            } for a in apps[:5]
        ]
    }
