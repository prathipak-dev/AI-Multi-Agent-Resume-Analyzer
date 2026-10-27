import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, JSON, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    target_role = Column(String(100), default="Full Stack Developer")
    created_at = Column(DateTime, default=datetime.utcnow)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    matches = relationship("MatchResult", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    target_domain = Column(String(100), default="Full Stack")
    parsed_skills = Column(JSON, default=list)
    parsed_experience = Column(JSON, default=list)
    parsed_education = Column(JSON, default=list)
    parsed_projects = Column(JSON, default=list)
    ats_score = Column(Float, default=75.0)
    resume_score = Column(Float, default=80.0)
    summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    matches = relationship("MatchResult", back_populates="resume", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    external_id = Column(String(100), unique=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    location = Column(String(255), default="Remote")
    salary_range = Column(String(100), default="₹6,00,000 - ₹12,00,000 LPA")
    job_type = Column(String(50), default="Full-time") # Full-time, Remote, Hybrid
    domain = Column(String(100), nullable=False, default="Full Stack", index=True)
    description = Column(Text, nullable=False)
    extracted_skills = Column(JSON, default=list)
    experience_level = Column(String(50), default="Fresher / 0-2 yrs")
    source = Column(String(50), default="Jooble")
    created_at = Column(DateTime, default=datetime.utcnow)

    matches = relationship("MatchResult", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    overall_match_score = Column(Float, nullable=False)
    semantic_score = Column(Float, default=80.0)
    skill_score = Column(Float, default=75.0)
    experience_score = Column(Float, default=85.0)
    ats_score = Column(Float, default=78.0)
    match_reasons = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="matches")
    resume = relationship("Resume", back_populates="matches")
    job = relationship("Job", back_populates="matches")

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    tailored_resume = Column(Text, nullable=False)
    cover_letter = Column(Text, nullable=False)
    hr_email = Column(Text, nullable=False)
    status = Column(String(50), default="Draft") # Draft, Ready, Applied
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    notes = relationship("ApplicationNote", back_populates="application", cascade="all, delete-orphan")


class ApplicationNote(Base):
    __tablename__ = "application_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    note = Column(Text, nullable=False)
    interview_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="Draft")  # Draft, Applied, Interview, Offer, Rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="notes")


class CareerGoal(Base):
    __tablename__ = "career_goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    target_role = Column(String(255), default="Software Engineer")
    target_domain = Column(String(100), default="Full Stack")
    target_companies = Column(JSON, default=list)
    skills_to_learn = Column(JSON, default=list)       # user-set goals
    milestones = Column(JSON, default=list)            # [{title, done, created_at}]
    projects = Column(JSON, default=list)              # [{title, url, skills, done}]
    notes = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    job = relationship("Job")


class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    is_visible = Column(Boolean, default=True)          # Candidate consent to be discoverable
    headline = Column(String(255), default="")
    bio = Column(Text, default="")
    github_url = Column(String(255), default="")
    linkedin_url = Column(String(255), default="")
    portfolio_url = Column(String(255), default="")
    available_for = Column(String(100), default="Full-time, Internship")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


class Connection(Base):
    __tablename__ = "connections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    requester_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, default="")
    status = Column(String(20), default="pending")    # pending, accepted, declined
    created_at = Column(DateTime, default=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requester_id])
    target = relationship("User", foreign_keys=[target_id])

