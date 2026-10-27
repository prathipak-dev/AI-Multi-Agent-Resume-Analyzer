from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User
from app.db.repository import ResumeRepository
from app.api.auth import get_current_user
from app.agents.career_recommendation import career_recommendation_agent
from app.agents.skill_gap import skill_gap_agent
from app.agents.state import AgentState


router = APIRouter(
    prefix="/advisor",
    tags=["Career Advisor & Skill Gap"]
)


@router.get("/roadmap")
async def get_career_roadmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume_repo = ResumeRepository(db)

    resume = await resume_repo.get_latest_by_user_id(
        current_user.id
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Please upload a resume first to generate your skill gap analysis."
        )

    state: AgentState = {
        "user_id": current_user.id,
        "target_role": current_user.target_role or "Full Stack Developer",
        "target_domain": resume.target_domain,
        "parsed_skills": resume.parsed_skills or []
    }

    gap_state = await skill_gap_agent.run(state)

    advisor_state = await career_recommendation_agent.run(
        gap_state
    )

    return {
        "target_role": gap_state.get(
            "target_role",
            current_user.target_role
        ),
        "target_domain": gap_state.get(
            "target_domain",
            "Full Stack"
        ),
        "matched_skills": gap_state.get(
            "matched_skills",
            []
        ),
        "missing_skills": gap_state.get(
            "missing_skills",
            []
        ),
        "skill_gap_score": gap_state.get(
            "skill_gap_score",
            0
        ),
        "improvement_suggestions": gap_state.get(
            "improvement_suggestions",
            []
        ),
        "learning_roadmap": gap_state.get(
            "learning_roadmap",
            []
        ),
        "interview_questions": advisor_state.get(
            "interview_questions",
            []
        )
    }


from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_with_advisor(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume_repo = ResumeRepository(db)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)
    skills = ", ".join(resume.parsed_skills) if (resume and resume.parsed_skills) else "Python, FastAPI, React, Next.js"
    domain = resume.target_domain if resume else (current_user.target_role or "Full Stack")

    system_prompt = (
        f"You are an expert AI Career Coach and Technical Interviewer for software engineers. "
        f"Candidate: {current_user.full_name}, Target Role: {current_user.target_role}, "
        f"Domain: {domain}, Skills: {skills}. "
        f"Provide direct, high-value, actionable, structured advice."
    )
    from app.services.groq_service import groq_service
    reply = await groq_service.generate_text(prompt=req.message, system_prompt=system_prompt)
    return {"reply": reply}