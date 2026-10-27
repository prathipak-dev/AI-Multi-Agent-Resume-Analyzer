import logging
from typing import Dict, Any
from app.agents.state import AgentState
from app.services.groq_service import groq_service

logger = logging.getLogger("PersonalizedApplicationAgent")

class PersonalizedApplicationAgent:
    """Agent 6: Generates customized ATS resume, cover letter, and HR email for a targeted job."""

    async def run(self, state: AgentState) -> AgentState:
        logger.info("Running Personalized Application Agent...")
        candidate_skills = ", ".join(state.get("parsed_skills", ["Python", "FastAPI", "React"]))
        raw_text = state.get("raw_text", "")
        
        # Pick top matched job or target job
        matched_jobs = state.get("matched_jobs", [])
        target_job = matched_jobs[0] if matched_jobs else {
            "title": "Software Engineer", 
            "company": "Top Tech SaaS", 
            "description": "Building high-performance microservices and frontend interfaces."
        }

        job_title = target_job.get("title")
        company = target_job.get("company")

        # 1. Generate Personalized Cover Letter
        cover_prompt = f"""
        Write a professional, compelling, startup-grade cover letter for a candidate applying to:
        Job Title: {job_title}
        Company: {company}
        Candidate Skills: {candidate_skills}
        Candidate Experience Summary: {raw_text[:1000]}

        Keep it concise, energetic, and tailored to freshers/early talent demonstrating high impact.
        """
        cover_letter = await groq_service.generate_text(cover_prompt)

        # 2. Generate Personalized HR Reachout Email
        email_prompt = f"""
        Write a high-converting 3-paragraph cold email to the HR/Recruiter at {company} for the {job_title} role.
        Highlight technical competencies ({candidate_skills}) and express genuine passion for their mission.
        """
        hr_email = await groq_service.generate_text(email_prompt)

        # 3. Generate Tailored Resume Markdown
        tailored_resume = f"""# Candidate Name
**Email:** candidate@email.com | **LinkedIn:** linkedin.com/in/candidate | **GitHub:** github.com/candidate

---

## PROFESSIONAL SUMMARY
Results-driven {job_title} candidate with expertise in {candidate_skills}. Demonstrated track record of building production-grade web applications, multi-agent systems, and REST microservices.

---

## CORE COMPETENCIES
- **Languages & Frameworks:** {candidate_skills}
- **Architecture & DB:** FastAPI, PostgreSQL, Redis, ChromaDB, Microservices
- **Tools & DevOps:** Docker, Git, CI/CD, Linux

---

## KEY PROJECTS & EXPERIENCE
### AI Multi-Agent Career Intelligence Platform
- Architected asynchronous FastAPI microservices and LangGraph agent workflow.
- Implemented ChromaDB vector embeddings for real-time semantic job matching.
- Developed modern Next.js 14 glassmorphic UI with dynamic state visualization.

---

## EDUCATION
**B.Tech in Computer Science & Engineering** (2025)
*Relevant Coursework:* Data Structures, Operating Systems, Database Management, System Design.
"""

        state["tailored_resume"] = tailored_resume
        state["cover_letter"] = cover_letter
        state["hr_email"] = hr_email
        state["current_step"] = "application_generation_complete"

        return state

personalized_application_agent = PersonalizedApplicationAgent()
