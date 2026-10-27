"""
Career Growth API
- Career goal setting, milestone tracking, project portfolio, skill-gap integration
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User
from app.db.repository import CareerGoalRepository, ResumeRepository
from app.api.auth import get_current_user
from app.services.groq_service import groq_service

router = APIRouter(prefix="/career", tags=["Career Growth"])


class MilestoneItem(BaseModel):
    title: str
    done: bool = False

class ProjectItem(BaseModel):
    title: str
    url: str = ""
    skills: List[str] = []
    done: bool = False

class CareerGoalUpdate(BaseModel):
    target_role: Optional[str] = None
    target_domain: Optional[str] = None
    target_companies: Optional[List[str]] = None
    skills_to_learn: Optional[List[str]] = None
    milestones: Optional[List[dict]] = None
    projects: Optional[List[dict]] = None
    notes: Optional[str] = None

class MilestoneToggle(BaseModel):
    index: int
    done: bool


@router.get("/goals")
async def get_career_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's career goals and progress."""
    repo = CareerGoalRepository(db)
    goal = await repo.get_by_user(current_user.id)
    if not goal:
        return {
            "has_goals": False,
            "target_role": current_user.target_role or "Software Engineer",
            "target_domain": "Full Stack",
            "target_companies": [],
            "skills_to_learn": [],
            "milestones": [],
            "projects": [],
            "notes": ""
        }
    return {
        "has_goals": True,
        "id": goal.id,
        "target_role": goal.target_role,
        "target_domain": goal.target_domain,
        "target_companies": goal.target_companies or [],
        "skills_to_learn": goal.skills_to_learn or [],
        "milestones": goal.milestones or [],
        "projects": goal.projects or [],
        "notes": goal.notes or "",
        "updated_at": goal.updated_at
    }


@router.post("/goals")
async def save_career_goals(
    data: CareerGoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save / update career goals."""
    repo = CareerGoalRepository(db)
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    goal = await repo.upsert(current_user.id, update_data)
    return {"success": True, "id": goal.id, "updated_at": goal.updated_at}


@router.post("/goals/milestone-toggle")
async def toggle_milestone(
    data: MilestoneToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle a milestone's completion status."""
    repo = CareerGoalRepository(db)
    goal = await repo.get_by_user(current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="No career goals found. Create goals first.")
    milestones = list(goal.milestones or [])
    if data.index < 0 or data.index >= len(milestones):
        raise HTTPException(status_code=400, detail="Invalid milestone index.")
    milestones[data.index]["done"] = data.done
    goal = await repo.upsert(current_user.id, {"milestones": milestones})
    return {"success": True, "milestones": goal.milestones}


@router.get("/recommendations")
async def get_ai_project_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """AI-powered project recommendations based on skill gaps and career goals."""
    resume_repo = ResumeRepository(db)
    goal_repo = CareerGoalRepository(db)

    resume = await resume_repo.get_latest_by_user_id(current_user.id)
    goal = await goal_repo.get_by_user(current_user.id)

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Upload your resume first to get personalized recommendations."
        )

    skills = ", ".join((resume.parsed_skills or [])[:20])
    target_role = (goal.target_role if goal else None) or current_user.target_role or "Software Engineer"
    skills_to_learn = ", ".join((goal.skills_to_learn or [])[:10]) if goal else ""
    domain = (goal.target_domain if goal else None) or resume.target_domain or "Full Stack"

    prompt = f"""
You are a senior tech career mentor.

Candidate profile:
- Target role: {target_role}
- Domain: {domain}
- Current skills: {skills or 'not specified'}
- Skills they want to learn: {skills_to_learn or 'not specified'}

Generate 4 specific project recommendations to help them reach their target role.

Each project should:
1. Be buildable in 1-4 weeks
2. Use technologies relevant to closing their skill gap
3. Be portfolio-worthy for job applications

Return JSON:
{{
  "projects": [
    {{
      "title": "project name",
      "description": "2-sentence description",
      "skills_practiced": ["skill1", "skill2"],
      "difficulty": "Beginner|Intermediate|Advanced",
      "estimated_hours": 20,
      "github_template": "suggestion for repo structure"
    }}
  ],
  "learning_path_note": "one-sentence advice"
}}
"""

    result = await groq_service.generate_json(
        prompt,
        system_prompt="You are a technical career mentor. Give specific, buildable project ideas. Never invent skills the user has.",
        max_tokens=1000
    )

    if not result.get("projects"):
        raise HTTPException(status_code=500, detail="Could not generate recommendations. Try again.")

    return {
        "target_role": target_role,
        "domain": domain,
        "projects": result.get("projects", []),
        "learning_path_note": result.get("learning_path_note", ""),
        "based_on_skills": (resume.parsed_skills or [])[:10]
    }


@router.get("/interview-prep")
async def get_interview_prep(
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate role-specific interview questions based on resume skills."""
    resume_repo = ResumeRepository(db)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)

    target_role = role or current_user.target_role or "Software Engineer"
    skills = ", ".join((resume.parsed_skills or [])[:15]) if resume else "Python, JavaScript"
    domain = resume.target_domain if resume else "Full Stack"

    prompt = f"""
Generate 8 interview questions for a {target_role} ({domain}) candidate.

Candidate skills: {skills}

Include a mix:
- 3 technical questions (based on their skills)
- 2 system design / architecture questions  
- 2 behavioral / STAR-format questions
- 1 situational problem-solving question

Return JSON:
{{
  "questions": [
    {{
      "question": "...",
      "category": "Technical|System Design|Behavioral|Problem Solving",
      "difficulty": "Easy|Medium|Hard",
      "hint": "what a good answer covers in 1 sentence",
      "sample_answer_structure": "STAR: ..."
    }}
  ]
}}
"""

    result = await groq_service.generate_json(
        prompt,
        system_prompt="You are a senior technical interviewer. Generate realistic interview questions based on the candidate's actual skills.",
        max_tokens=1200
    )

    if not result.get("questions"):
        raise HTTPException(status_code=500, detail="Could not generate questions. Try again.")

    return {
        "target_role": target_role,
        "questions": result.get("questions", []),
        "skills_covered": (resume.parsed_skills or [])[:10] if resume else []
    }
