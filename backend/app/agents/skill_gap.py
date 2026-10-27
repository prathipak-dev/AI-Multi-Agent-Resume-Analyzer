import logging
from typing import Dict, Any, List
from app.agents.state import AgentState
from app.services.groq_service import groq_service

logger = logging.getLogger("SkillGapAgent")

COMMON_TARGET_SKILLS = {
    "Full Stack": [
        "TypeScript",
        "Next.js",
        "FastAPI",
        "PostgreSQL",
        "Docker",
        "Redis",
        "Tailwind CSS"
    ],
    "AI/ML": [
        "LangGraph",
        "ChromaDB",
        "PyTorch",
        "RAG",
        "Groq API",
        "Vector Embeddings",
        "Python"
    ],
    "DevOps": [
        "Docker",
        "Kubernetes",
        "AWS",
        "GitHub Actions",
        "Terraform",
        "Linux"
    ],
    "Cyber Security": [
        "OWASP",
        "Penetration Testing",
        "JWT Security",
        "Wireshark",
        "Linux"
    ],
    "Data Analyst": [
        "SQL",
        "Pandas",
        "PowerBI",
        "Tableau",
        "Excel",
        "Data Visualization"
    ],
    "UI/UX": [
        "Figma",
        "Design Systems",
        "Prototyping",
        "User Research",
        "Wireframing"
    ],
    "Testing": [
        "Selenium",
        "PyTest",
        "Cypress",
        "Postman",
        "API Testing"
    ]
}


class SkillGapAgent:
    async def run(self, state: AgentState) -> AgentState:
        logger.info("Running Skill Gap & Resume Improvement Agent...")

        candidate_skills = [
            skill.lower()
            for skill in state.get("parsed_skills", [])
        ]

        target_domain = state.get(
            "target_domain",
            "Full Stack"
        )

        required = COMMON_TARGET_SKILLS.get(
            target_domain,
            COMMON_TARGET_SKILLS["Full Stack"]
        )

        matched = [
            skill
            for skill in required
            if skill.lower() in candidate_skills
        ]

        missing = [
            skill
            for skill in required
            if skill.lower() not in candidate_skills
        ]

        if required:
            skill_gap_score = round(
                (len(matched) / len(required)) * 100,
                2
            )
        else:
            skill_gap_score = 0

        prompt = f"""
Candidate Target Role: {state.get("target_role", "Full Stack Developer")}
Candidate Target Domain: {target_domain}
Candidate Current Skills: {", ".join(state.get("parsed_skills", []))}
Matched Skills: {", ".join(matched)}
Missing Critical Tech Stack: {", ".join(missing)}

Provide JSON output with:
1. "suggestions": 4 actionable ATS resume improvement bullet points.
2. "roadmap": 4-week learning roadmap with week, topic, duration,
   and recommended project.
"""

        llm_output = await groq_service.generate_json(
            prompt,
            system_prompt=(
                "You are a Principal Technical Recruiter "
                "and Career Architect."
            )
        )

        suggestions = llm_output.get(
            "suggestions",
            [
                "Add measurable achievements and technical impact to resume bullet points.",
                "Highlight projects that demonstrate practical use of the missing skills.",
                "Include relevant keywords such as CI/CD, APIs, Docker, databases, and cloud technologies.",
                "Organize technical skills into clear categories such as Languages, Frameworks, Databases, and Tools."
            ]
        )

        roadmap = llm_output.get(
            "roadmap",
            [
                {
                    "week": "Week 1",
                    "topic": missing[0] if missing else "FastAPI",
                    "duration": "7 days",
                    "action": "Build REST APIs using FastAPI, Pydantic, and asynchronous Python.",
                    "project": "Build a Job Management REST API."
                },
                {
                    "week": "Week 2",
                    "topic": "Database & Backend",
                    "duration": "7 days",
                    "action": "Learn PostgreSQL, SQLAlchemy, authentication, and database integration.",
                    "project": "Build a Job Application Tracker."
                },
                {
                    "week": "Week 3",
                    "topic": "Frontend Integration",
                    "duration": "7 days",
                    "action": "Connect Next.js and TypeScript frontend with the FastAPI backend.",
                    "project": "Build a Full Stack Career Dashboard."
                },
                {
                    "week": "Week 4",
                    "topic": "Docker & Deployment",
                    "duration": "7 days",
                    "action": "Learn Docker, Docker Compose, and basic CI/CD deployment.",
                    "project": "Containerize and deploy the complete application."
                }
            ]
        )

        state["target_role"] = state.get(
            "target_role",
            "Full Stack Developer"
        )

        state["target_domain"] = target_domain
        state["matched_skills"] = matched
        state["missing_skills"] = missing
        state["skill_gap_score"] = skill_gap_score
        state["improvement_suggestions"] = suggestions
        state["learning_roadmap"] = roadmap
        state["current_step"] = "skill_gap_analysis_complete"

        return state


skill_gap_agent = SkillGapAgent()