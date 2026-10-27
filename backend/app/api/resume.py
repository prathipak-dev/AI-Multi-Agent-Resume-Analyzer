from io import BytesIO
from typing import Optional

from pypdf import PdfReader
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import Resume, User
from app.db.repository import ResumeRepository
from app.api.auth import get_current_user
from app.agents.resume_intelligence import resume_intelligence_agent
from app.agents.deep_analyzer import run_deep_analysis
from app.agents.jd_matcher import run_jd_matching
from app.services.groq_service import groq_service
from app.agents.state import AgentState


router = APIRouter(prefix="/resume", tags=["Resume Intelligence"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


# ─────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────

class JDMatchRequest(BaseModel):
    job_description: str
    resume_id: Optional[str] = None  # if None, use latest resume

class ImproveRequest(BaseModel):
    bullet: str
    context: str = ""  # surrounding context
    target_role: str = "Software Engineer"
    resume_id: Optional[str] = None

class IssueStatusUpdate(BaseModel):
    issue_id: int
    status: str  # "accepted" | "rejected"
    resume_id: str


# ─────────────────────────────────────────────
# Helper: Extract text from uploaded file
# ─────────────────────────────────────────────

async def extract_text_from_file(file: UploadFile) -> str:
    """Extract text content from PDF or TXT file with validation."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required")

    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported. Please upload a .pdf or .txt file."
        )

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds 10 MB limit. Please upload a smaller file."
        )

    raw_text = ""

    if file.filename.lower().endswith(".pdf"):
        try:
            reader = PdfReader(BytesIO(content))
            for page in reader.pages:
                page_text = page.extract_text() or ""
                raw_text += page_text + "\n"
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to read PDF file. Please ensure the PDF is not password-protected or corrupted. ({type(e).__name__})"
            )
    else:
        raw_text = content.decode("utf-8", errors="ignore")

    raw_text = raw_text.strip()

    if not raw_text:
        raise HTTPException(
            status_code=400,
            detail="The uploaded resume contains no readable text. If this is a scanned PDF, please use a text-based PDF instead."
        )

    if len(raw_text) < 30:
        raise HTTPException(
            status_code=400,
            detail="The resume contains too little text to analyze. Please upload a complete resume."
        )

    return raw_text


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and analyze a resume. Returns parsed data and ATS score."""
    raw_text = await extract_text_from_file(file)

    initial_state: AgentState = {
        "user_id": current_user.id,
        "raw_text": raw_text
    }

    try:
        intel_state = await resume_intelligence_agent.run(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {str(e)}")

    parsed_skills = intel_state.get("parsed_skills", [])
    parsed_experience = intel_state.get("parsed_experience", [])
    parsed_education = intel_state.get("parsed_education", [])
    parsed_projects = intel_state.get("parsed_projects", [])
    target_domain = intel_state.get("target_domain", "Full Stack")
    ats_score = intel_state.get("ats_score", 0)
    resume_score = intel_state.get("resume_score", 0)

    summary = f"Parsed {len(parsed_skills)} skills across {target_domain} domain."

    resume_repo = ResumeRepository(db)
    new_resume = Resume(
        user_id=current_user.id,
        file_name=file.filename,
        raw_text=raw_text,
        target_domain=target_domain,
        parsed_skills=parsed_skills,
        parsed_experience=parsed_experience,
        parsed_education=parsed_education,
        parsed_projects=parsed_projects,
        ats_score=ats_score,
        resume_score=resume_score,
        summary=summary
    )

    saved_resume = await resume_repo.create(new_resume)

    return {
        "id": saved_resume.id,
        "file_name": saved_resume.file_name,
        "target_domain": saved_resume.target_domain,
        "parsed_skills": saved_resume.parsed_skills,
        "parsed_experience": saved_resume.parsed_experience,
        "parsed_education": saved_resume.parsed_education,
        "parsed_projects": saved_resume.parsed_projects,
        "ats_score": saved_resume.ats_score,
        "resume_score": saved_resume.resume_score,
        "created_at": saved_resume.created_at
    }


@router.get("/latest")
async def get_latest_resume(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the user's most recently uploaded resume."""
    resume_repo = ResumeRepository(db)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)

    if not resume:
        return {"has_resume": False, "detail": "No resume uploaded yet"}

    return {
        "has_resume": True,
        "id": resume.id,
        "file_name": resume.file_name,
        "target_domain": resume.target_domain,
        "parsed_skills": resume.parsed_skills,
        "parsed_experience": resume.parsed_experience,
        "parsed_education": resume.parsed_education,
        "parsed_projects": resume.parsed_projects,
        "ats_score": resume.ats_score,
        "resume_score": resume.resume_score,
        "summary": resume.summary,
        "created_at": resume.created_at
    }


@router.get("/history")
async def get_resume_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all resumes uploaded by the current user (most recent first)."""
    resume_repo = ResumeRepository(db)
    resumes = await resume_repo.get_all_by_user_id(current_user.id)

    return {
        "resumes": [
            {
                "id": r.id,
                "file_name": r.file_name,
                "target_domain": r.target_domain,
                "ats_score": r.ats_score,
                "resume_score": r.resume_score,
                "skills_count": len(r.parsed_skills or []),
                "created_at": r.created_at
            }
            for r in resumes
        ],
        "count": len(resumes)
    }


@router.get("/deep-analysis")
async def get_deep_analysis(
    resume_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run deep resume analysis on the latest (or specified) resume.
    Returns 12-category issue detection with severity, explanations, and suggested fixes.
    """
    resume_repo = ResumeRepository(db)

    if resume_id:
        resume = await resume_repo.get_by_id_and_user(resume_id, current_user.id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found or access denied.")
    else:
        resume = await resume_repo.get_latest_by_user_id(current_user.id)

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Please upload a resume first."
        )

    try:
        analysis = await run_deep_analysis(
            raw_text=resume.raw_text,
            parsed_skills=resume.parsed_skills or [],
            parsed_experience=resume.parsed_experience or [],
            parsed_education=resume.parsed_education or [],
            parsed_projects=resume.parsed_projects or [],
            target_domain=resume.target_domain or "Full Stack"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deep analysis failed: {str(e)}")

    return {
        "resume_id": resume.id,
        "file_name": resume.file_name,
        **analysis
    }


@router.post("/analyze-jd")
async def analyze_job_description(
    req: JDMatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare resume against a pasted job description.
    Returns transparent match score, keyword gaps, and prioritized recommendations.
    """
    if not req.job_description or len(req.job_description.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Job description must be at least 50 characters. Please paste the full JD."
        )

    resume_repo = ResumeRepository(db)

    if req.resume_id:
        resume = await resume_repo.get_by_id_and_user(req.resume_id, current_user.id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found or access denied.")
    else:
        resume = await resume_repo.get_latest_by_user_id(current_user.id)

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume found. Please upload a resume first."
        )

    try:
        result = await run_jd_matching(
            raw_resume_text=resume.raw_text,
            jd_text=req.job_description,
            parsed_skills=resume.parsed_skills or [],
            target_domain=resume.target_domain or "Full Stack"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD matching failed: {str(e)}")

    return {
        "resume_id": resume.id,
        "file_name": resume.file_name,
        **result
    }


@router.post("/improve-bullet")
async def improve_bullet_point(
    req: ImproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI-powered rewrite of a resume bullet point.
    Only uses facts from the original bullet — does not fabricate information.
    """
    if not req.bullet or len(req.bullet.strip()) < 10:
        raise HTTPException(status_code=400, detail="Bullet point text is too short.")

    prompt = f"""
Rewrite the following resume bullet point to make it more impactful for a {req.target_role} role.

Rules:
- Keep ONLY facts that are present in the original text. Do NOT add fake metrics, company names, technologies, or outcomes.
- Use a strong action verb (Built, Developed, Reduced, Improved, Automated, Deployed, etc.)
- If there are no metrics in the original, add a placeholder like [X%] or [N users] to indicate where a metric should go.
- Keep it to 1-2 lines maximum.
- Return only the improved bullet text, no extra explanation.

Original bullet: {req.bullet}
Additional context (if any): {req.context}

Return JSON: {{"improved": "...", "explanation": "...", "placeholder_added": true/false}}
"""

    try:
        result = await groq_service.generate_json(
            prompt,
            system_prompt="You are a precise resume writing expert. Never invent facts. Use placeholders when metrics are missing.",
            max_tokens=400
        )
        if not result.get("improved"):
            raise ValueError("Empty response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI improvement failed: {str(e)}")

    return {
        "original": req.bullet,
        "improved": result.get("improved", ""),
        "explanation": result.get("explanation", ""),
        "placeholder_added": result.get("placeholder_added", False),
        "warning": "Review the improved version carefully. AI may miss context — always verify accuracy."
    }


@router.post("/improve-summary")
async def improve_professional_summary(
    target_role: str = Body(...),
    existing_summary: str = Body(""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate or improve a professional summary based on the user's actual resume data.
    """
    resume_repo = ResumeRepository(db)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)

    if not resume:
        raise HTTPException(status_code=404, detail="No resume found. Please upload a resume first.")

    skills_str = ", ".join((resume.parsed_skills or [])[:15])
    exp_count = len(resume.parsed_experience or [])
    proj_count = len(resume.parsed_projects or [])

    prompt = f"""
Write a professional resume summary for a {target_role} candidate.

Use ONLY the following information:
- Skills: {skills_str or 'not specified'}
- Work/Internship entries: {exp_count}
- Projects: {proj_count}
- Domain: {resume.target_domain or 'Software Engineering'}
- Name: {current_user.full_name}
{f'- Existing summary to improve: {existing_summary}' if existing_summary else ''}

Rules:
- 3-4 sentences maximum
- Start with a strong role title and years/level of experience
- Mention 2-3 key skills from the list
- If you lack data for specifics, use [placeholder] notation
- Do NOT invent companies, degrees, certifications, or fake achievements

Return JSON: {{"summary": "...", "word_count": N}}
"""

    try:
        result = await groq_service.generate_json(
            prompt,
            system_prompt="You are a professional resume writer. Never fabricate experience or credentials.",
            max_tokens=400
        )
        summary = result.get("summary", "")
        if not summary:
            raise ValueError("Empty summary")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

    return {
        "summary": summary,
        "word_count": result.get("word_count", len(summary.split())),
        "target_role": target_role,
        "warning": "Review this summary carefully before using it. AI-generated content should be personalized with your specific details."
    }