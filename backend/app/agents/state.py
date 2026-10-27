from typing import Dict, Any, List, Optional
from typing_extensions import TypedDict

class AgentState(TypedDict, total=False):
    user_id: str
    resume_id: str
    raw_text: str
    target_role: str
    target_domain: str

    parsed_skills: List[str]
    parsed_experience: List[Dict[str, Any]]
    parsed_education: List[Dict[str, Any]]
    parsed_projects: List[Dict[str, Any]]
    ats_score: float
    resume_score: float

    job_list: List[Dict[str, Any]]
    classified_jobs: List[Dict[str, Any]]

    target_job_id: Optional[str]
    matched_jobs: List[Dict[str, Any]]

    matched_skills: List[str]
    missing_skills: List[str]
    skill_gap_score: float
    improvement_suggestions: List[str]
    learning_roadmap: List[Dict[str, Any]]

    tailored_resume: str
    cover_letter: str
    hr_email: str

    interview_questions: List[Dict[str, Any]]

    error: Optional[str]
    current_step: str