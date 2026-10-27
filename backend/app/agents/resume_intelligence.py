import re
import logging
from typing import Dict, Any, List

from app.agents.state import AgentState
from app.services.groq_service import groq_service
from app.services.vector_service import vector_service

logger = logging.getLogger("ResumeIntelligenceAgent")

TECH_SKILLS_KEYWORDS = [
    "Python", "JavaScript", "TypeScript", "React", "Next.js", "FastAPI",
    "Node.js", "PostgreSQL", "MongoDB", "SQL", "Docker", "Kubernetes",
    "AWS", "Git", "GitHub", "LangGraph", "LangChain", "ChromaDB",
    "PyTorch", "TensorFlow", "Tailwind CSS", "Redux", "REST API",
    "GraphQL", "Redis", "Celery", "Linux", "PyTest", "Figma",
    "PowerBI", "Pandas", "NumPy", "C++", "Java", "HTML", "CSS"
]

VALID_DOMAINS = [
    "Full Stack",
    "AI/ML",
    "Cyber Security",
    "DevOps",
    "Testing",
    "Data Analyst",
    "UI/UX",
    "Backend",
    "Frontend"
]


class ResumeIntelligenceAgent:
    """Agent 3: Extracts real resume information and calculates ATS score."""

    async def run(self, state: AgentState) -> AgentState:
        logger.info("Running Resume Intelligence Agent...")

        raw_text = (state.get("raw_text") or "").strip()

        # Never analyze an empty or meaningless resume.
        if len(raw_text) < 50:
            raise ValueError(
                "Resume contains no meaningful readable text. "
                "Please upload a valid resume."
            )

        # Send only real extracted resume text to the LLM.
        prompt = f"""
You are an expert ATS resume parser.

Analyze ONLY the resume text provided below.
Do NOT invent, assume, or add information that is not present.

Return valid JSON with exactly this structure:

{{
    "skills": [],
    "target_domain": "",
    "experience": [],
    "projects": [],
    "education": []
}}

Rules:
- skills: include only technologies/skills actually present.
- target_domain: choose the best matching domain from:
  Full Stack, AI/ML, Cyber Security, DevOps, Testing,
  Data Analyst, UI/UX, Backend, Frontend.
- experience: extract only real work/internship experience.
- projects: extract only projects actually mentioned.
- education: extract only education actually mentioned.
- If a section is missing, return an empty array.
- Never create fake companies, colleges, projects, roles, dates, or skills.

Resume Text:
{raw_text[:12000]}
"""

        llm_data = await groq_service.generate_json(
            prompt,
            system_prompt=(
                "You are a strict ATS Resume Intelligence Parser. "
                "Never hallucinate resume information."
            )
        )

        if not isinstance(llm_data, dict):
            llm_data = {}

        # ---------------------------------------------------------
        # 1. Extract skills from LLM + deterministic keyword scan
        # ---------------------------------------------------------

        llm_skills = llm_data.get("skills", [])

        if not isinstance(llm_skills, list):
            llm_skills = []

        found_skills = [
            str(skill).strip()
            for skill in llm_skills
            if str(skill).strip()
        ]

        keyword_skills = [
            skill
            for skill in TECH_SKILLS_KEYWORDS
            if re.search(
                rf"(?<!\w){re.escape(skill)}(?!\w)",
                raw_text,
                re.IGNORECASE
            )
        ]

        # Merge without duplicates.
        for skill in keyword_skills:
            if skill.lower() not in [x.lower() for x in found_skills]:
                found_skills.append(skill)

        # ---------------------------------------------------------
        # 2. Extract real sections only
        # ---------------------------------------------------------

        experience = llm_data.get("experience", [])
        education = llm_data.get("education", [])
        projects = llm_data.get("projects", [])

        if not isinstance(experience, list):
            experience = []

        if not isinstance(education, list):
            education = []

        if not isinstance(projects, list):
            projects = []

        # ---------------------------------------------------------
        # 3. Determine domain from actual resume content
        # ---------------------------------------------------------

        target_domain = str(
            llm_data.get("target_domain", "")
        ).strip()

        if target_domain not in VALID_DOMAINS:
            text_lower = raw_text.lower()

            domain_scores = {
                "AI/ML": 0,
                "Cyber Security": 0,
                "DevOps": 0,
                "Testing": 0,
                "Data Analyst": 0,
                "UI/UX": 0,
                "Backend": 0,
                "Frontend": 0,
                "Full Stack": 0,
            }

            domain_keywords = {
                "AI/ML": [
                    "machine learning",
                    "deep learning",
                    "artificial intelligence",
                    "tensorflow",
                    "pytorch",
                    "langchain",
                    "langgraph",
                    "rag",
                    "nlp",
                ],
                "Cyber Security": [
                    "cyber security",
                    "cybersecurity",
                    "penetration testing",
                    "ethical hacking",
                    "owasp",
                    "network security",
                    "security analyst",
                ],
                "DevOps": [
                    "devops",
                    "docker",
                    "kubernetes",
                    "aws",
                    "azure",
                    "jenkins",
                    "ci/cd",
                    "terraform",
                ],
                "Testing": [
                    "software testing",
                    "qa",
                    "quality assurance",
                    "selenium",
                    "cypress",
                    "test automation",
                    "pytest",
                ],
                "Data Analyst": [
                    "data analyst",
                    "data analysis",
                    "power bi",
                    "powerbi",
                    "tableau",
                    "excel",
                    "pandas",
                    "numpy",
                    "sql",
                ],
                "UI/UX": [
                    "ui design",
                    "ux design",
                    "ui/ux",
                    "figma",
                    "wireframe",
                    "prototype",
                    "user experience",
                ],
                "Backend": [
                    "backend",
                    "back-end",
                    "api development",
                    "rest api",
                    "fastapi",
                    "node.js",
                    "express",
                    "django",
                ],
                "Frontend": [
                    "frontend",
                    "front-end",
                    "react",
                    "next.js",
                    "javascript",
                    "typescript",
                    "html",
                    "css",
                ],
                "Full Stack": [
                    "full stack",
                    "full-stack",
                    "frontend and backend",
                    "front end and back end",
                ],
            }

            for domain, keywords in domain_keywords.items():
                for keyword in keywords:
                    if keyword in text_lower:
                        domain_scores[domain] += 1

            best_domain = max(
                domain_scores,
                key=domain_scores.get
            )

            if domain_scores[best_domain] > 0:
                target_domain = best_domain
            else:
                target_domain = "Unclassified"

        # ---------------------------------------------------------
        # 4. Real ATS scoring
        # ---------------------------------------------------------

        if not raw_text or len(raw_text) < 50:
            ats_score = 0.0
            resume_score = 0.0

        else:
            score = 0.0

            # Skills
            if found_skills:
                score += 25.0

            # Experience
            if experience:
                score += 20.0

            # Education
            if education:
                score += 20.0

            # Projects
            if projects:
                score += 20.0

            # Resume length/readability
            if len(raw_text) >= 1000:
                score += 15.0
            elif len(raw_text) >= 500:
                score += 10.0
            else:
                score += 5.0

            ats_score = min(100.0, score)

            # Resume score is slightly higher only for a valid resume.
            resume_score = min(
                100.0,
                ats_score + 5.0
            )

        # ---------------------------------------------------------
        # 5. Update agent state
        # ---------------------------------------------------------

        state["parsed_skills"] = found_skills
        state["target_domain"] = target_domain
        state["parsed_experience"] = experience
        state["parsed_education"] = education
        state["parsed_projects"] = projects

        state["ats_score"] = round(ats_score, 1)
        state["resume_score"] = round(resume_score, 1)

        state["current_step"] = "resume_intelligence_complete"

        return state


resume_intelligence_agent = ResumeIntelligenceAgent()