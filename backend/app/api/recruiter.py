"""
Recruiter Connect API
- Candidate profile with explicit visibility consent
- Discovery of other visible candidates
- Connection requests and status management
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User, Connection
from app.db.repository import RecruiterProfileRepository, ConnectionRepository, ResumeRepository, UserRepository
from app.api.auth import get_current_user

router = APIRouter(prefix="/recruiter", tags=["Recruiter Connect"])


class ProfileUpdate(BaseModel):
    is_visible: Optional[bool] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    available_for: Optional[str] = None

class ConnectRequest(BaseModel):
    target_user_id: str
    message: str = ""

class ConnectionAction(BaseModel):
    connection_id: str
    action: str  # "accept" | "decline"


@router.get("/profile/me")
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get own recruiter/candidate profile."""
    profile_repo = RecruiterProfileRepository(db)
    resume_repo = ResumeRepository(db)

    profile = await profile_repo.get_by_user(current_user.id)
    resume = await resume_repo.get_latest_by_user_id(current_user.id)

    return {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "target_role": current_user.target_role
        },
        "profile": {
            "is_visible": profile.is_visible if profile else True,
            "headline": profile.headline if profile else "",
            "bio": profile.bio if profile else "",
            "github_url": profile.github_url if profile else "",
            "linkedin_url": profile.linkedin_url if profile else "",
            "portfolio_url": profile.portfolio_url if profile else "",
            "available_for": profile.available_for if profile else "Full-time, Internship"
        },
        "resume_summary": {
            "has_resume": resume is not None,
            "skills": (resume.parsed_skills or [])[:12] if resume else [],
            "domain": resume.target_domain if resume else None,
            "ats_score": resume.ats_score if resume else None
        }
    }


@router.put("/profile/me")
async def update_my_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update recruiter/candidate profile and visibility consent."""
    profile_repo = RecruiterProfileRepository(db)
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    profile = await profile_repo.upsert(current_user.id, update_data)
    return {
        "success": True,
        "is_visible": profile.is_visible,
        "message": "Profile updated. You are now discoverable by others." if profile.is_visible else "Profile hidden from discovery."
    }


@router.get("/candidates")
async def discover_candidates(
    domain: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Discover visible candidate profiles (excluding self)."""
    profile_repo = RecruiterProfileRepository(db)
    resume_repo = ResumeRepository(db)
    conn_repo = ConnectionRepository(db)

    profiles = await profile_repo.get_all_visible()

    sent = await conn_repo.get_sent(current_user.id)
    sent_map = {c.target_id: c.status for c in sent}

    results = []
    for prof in profiles:
        if prof.user_id == current_user.id:
            continue

        # Load user and resume for each profile
        from sqlalchemy.future import select
        from app.db.models import User as UserModel, Resume
        user_res = await db.execute(select(UserModel).where(UserModel.id == prof.user_id))
        user = user_res.scalars().first()
        if not user:
            continue

        resume = await resume_repo.get_latest_by_user_id(prof.user_id)

        if domain and resume and resume.target_domain != domain:
            continue

        results.append({
            "user_id": user.id,
            "full_name": user.full_name,
            "target_role": user.target_role,
            "headline": prof.headline,
            "bio": prof.bio[:200] + "..." if len(prof.bio or "") > 200 else prof.bio,
            "github_url": prof.github_url,
            "linkedin_url": prof.linkedin_url,
            "portfolio_url": prof.portfolio_url,
            "available_for": prof.available_for,
            "skills": (resume.parsed_skills or [])[:8] if resume else [],
            "domain": resume.target_domain if resume else None,
            "ats_score": resume.ats_score if resume else None,
            "connection_status": sent_map.get(user.id, None)
        })

    return {"candidates": results, "count": len(results)}


@router.post("/connect")
async def send_connection(
    data: ConnectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a connection request to another candidate."""
    if data.target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself.")

    # Verify target user exists and is visible
    user_repo = UserRepository(db)
    target = await user_repo.get_by_id(data.target_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    conn_repo = ConnectionRepository(db)
    existing = await conn_repo.get_by_users(current_user.id, data.target_user_id)
    if existing:
        return {"success": False, "message": f"Connection already {existing.status}.", "status": existing.status}

    conn = Connection(
        requester_id=current_user.id,
        target_id=data.target_user_id,
        message=data.message[:500] if data.message else ""
    )
    saved = await conn_repo.create(conn)
    return {"success": True, "connection_id": saved.id, "status": "pending"}


@router.get("/connections")
async def my_connections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all connection requests (sent and received)."""
    conn_repo = ConnectionRepository(db)
    user_repo = UserRepository(db)

    sent = await conn_repo.get_sent(current_user.id)
    received = await conn_repo.get_received(current_user.id)

    async def enrich(conn, direction):
        other_id = conn.target_id if direction == "sent" else conn.requester_id
        other = await user_repo.get_by_id(other_id)
        return {
            "id": conn.id,
            "direction": direction,
            "other_user": {
                "id": other.id,
                "full_name": other.full_name,
                "target_role": other.target_role
            } if other else None,
            "message": conn.message,
            "status": conn.status,
            "created_at": conn.created_at
        }

    sent_enriched = [await enrich(c, "sent") for c in sent]
    received_enriched = [await enrich(c, "received") for c in received]

    return {
        "sent": sent_enriched,
        "received": received_enriched,
        "pending_received": sum(1 for c in received if c.status == "pending")
    }


@router.post("/connections/respond")
async def respond_to_connection(
    data: ConnectionAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept or decline a received connection request."""
    if data.action not in ("accept", "decline"):
        raise HTTPException(status_code=400, detail="Action must be 'accept' or 'decline'.")

    conn_repo = ConnectionRepository(db)
    conn = await conn_repo.update_status(data.connection_id, data.action + "d")

    if not conn or conn.target_id != current_user.id:
        raise HTTPException(status_code=404, detail="Connection not found or you are not the recipient.")

    return {"success": True, "status": conn.status}
