from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import User, MatchResult
from app.db.repository import ResumeRepository, MatchRepository
from app.api.auth import get_current_user
from app.agents.coordinator import coordinator_agent
from app.agents.state import AgentState

router = APIRouter(prefix="/matches", tags=["Multi-Agent Matching Engine"])

@router.post("/run")
async def run_matching_pipeline(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch user's latest uploaded resume
    resume_repo = ResumeRepository(db)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)
    if not resume:
        raise HTTPException(status_code=400, detail="Please upload a resume first to run AI matching.")

    # 2. Build initial LangGraph AgentState
    initial_state: AgentState = {
        "user_id": current_user.id,
        "resume_id": resume.id,
        "raw_text": resume.raw_text,
        "target_domain": resume.target_domain,
        "parsed_skills": resume.parsed_skills or [],
        "parsed_experience": resume.parsed_experience or [],
        "parsed_education": resume.parsed_education or [],
        "ats_score": resume.ats_score
    }

    # 3. Execute LangGraph Workflow Graph across all 7 agents
    final_state = await coordinator_agent.execute_pipeline(initial_state)

    # 4. Save Top Matches to Database
    match_repo = MatchRepository(db)
    matched_jobs = final_state.get("matched_jobs", [])

    saved_matches = []
    for item in matched_jobs[:10]:
        match_obj = MatchResult(
            user_id=current_user.id,
            resume_id=resume.id,
            job_id=item["job_id"],
            overall_match_score=item["overall_match_score"],
            semantic_score=item.get("semantic_score", 80.0),
            skill_score=item.get("skill_score", 75.0),
            ats_score=item.get("ats_score", 78.0),
            match_reasons=item.get("reasons", []),
            missing_skills=item.get("missing_skills", [])
        )
        try:
            saved = await match_repo.save_match(match_obj)
            saved_matches.append(saved)
        except Exception:
            pass # Ignore duplicates if any

    return {
        "user_id": current_user.id,
        "target_domain": final_state.get("target_domain"),
        "ats_score": final_state.get("ats_score"),
        "missing_skills": final_state.get("missing_skills", []),
        "improvement_suggestions": final_state.get("improvement_suggestions", []),
        "matched_jobs": matched_jobs[:20],
        "learning_roadmap": final_state.get("learning_roadmap", []),
        "interview_questions": final_state.get("interview_questions", [])
    }
