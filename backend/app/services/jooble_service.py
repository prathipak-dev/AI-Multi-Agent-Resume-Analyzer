import httpx
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger("JoobleService")

FALLBACK_JOBS = [
    {
        "id": "jooble-101",
        "title": "Junior Full Stack Engineer (Next.js & FastAPI)",
        "company": "TechNova AI Solutions",
        "location": "Bengaluru, India (Remote)",
        "salary_range": "₹8,00,000 - ₹14,00,000 LPA",
        "job_type": "Remote",
        "domain": "Full Stack",
        "description": "We are seeking a high-performing Graduate Full Stack Engineer passionate about React, Next.js, Python FastAPI, and PostgreSQL. You will work on real-time multi-agent workflows and vector databases.",
        "extracted_skills": ["React", "Next.js", "Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
        "experience_level": "Fresher / 0-1 yr"
    },
    {
        "id": "jooble-102",
        "title": "Associate AI/ML Engineer - GenAI & LangGraph",
        "company": "Cognitive Scale Labs",
        "location": "Hyderabad, India (Hybrid)",
        "salary_range": "₹10,00,000 - ₹18,00,000 LPA",
        "job_type": "Hybrid",
        "domain": "AI/ML",
        "description": "Join our AI research team to build autonomous agentic workflows using LangGraph, Groq, ChromaDB, and PyTorch. Experience with LLM fine-tuning, RAG architectures, and vector embeddings is a big plus.",
        "extracted_skills": ["Python", "PyTorch", "LangGraph", "LangChain", "RAG", "ChromaDB", "Groq API"],
        "experience_level": "Fresher / 0-2 yrs"
    },
    {
        "id": "jooble-103",
        "title": "Junior DevOps & Cloud Platform Engineer",
        "company": "CloudPulse Systems",
        "location": "Pune, India (Remote)",
        "salary_range": "₹7,50,000 - ₹12,00,000 LPA",
        "job_type": "Remote",
        "domain": "DevOps",
        "description": "Looking for enthusiastic DevOps engineers with knowledge of Docker, Kubernetes, CI/CD pipelines (GitHub Actions), AWS S3, Terraform, and Linux administration.",
        "extracted_skills": ["Docker", "Kubernetes", "AWS", "GitHub Actions", "Terraform", "Linux", "CI/CD"],
        "experience_level": "Fresher / 0-1 yr"
    },
    {
        "id": "jooble-104",
        "title": "Associate Cyber Security Analyst",
        "company": "SecureNet Global",
        "location": "Gurugram, India",
        "salary_range": "₹8,50,000 - ₹15,00,000 LPA",
        "job_type": "Full-time",
        "domain": "Cyber Security",
        "description": "Responsibility includes vulnerability assessment, penetration testing (OWASP Top 10), network traffic analysis, JWT security audits, and SIEM monitoring.",
        "extracted_skills": ["Penetration Testing", "OWASP", "Network Security", "JWT", "Python", "Linux", "Wireshark"],
        "experience_level": "Fresher / 0-2 yrs"
    },
    {
        "id": "jooble-105",
        "title": "Junior Data Analyst & BI Developer",
        "company": "DataSight Analytics",
        "location": "Mumbai, India (Hybrid)",
        "salary_range": "₹6,50,000 - ₹11,00,000 LPA",
        "job_type": "Hybrid",
        "domain": "Data Analyst",
        "description": "Transform data into actionable business insights. Required proficiency in SQL, Python (Pandas/NumPy), Tableau, PowerBI, and data visualization.",
        "extracted_skills": ["SQL", "Python", "Pandas", "PowerBI", "Tableau", "Data Analysis", "Excel"],
        "experience_level": "Fresher / 0-1 yr"
    },
    {
        "id": "jooble-106",
        "title": "UI/UX Product Designer - AI SaaS Platform",
        "company": "Apex Design Studio",
        "location": "Bengaluru, India (Remote)",
        "salary_range": "₹7,00,000 - ₹13,00,000 LPA",
        "job_type": "Remote",
        "domain": "UI/UX",
        "description": "Design world-class glassmorphic micro-interactions, dark mode dashboards, design systems, wireframes, and prototypes in Figma for next-gen SaaS products.",
        "extracted_skills": ["Figma", "UI/UX Design", "Wireframing", "Prototyping", "Design Systems", "User Research"],
        "experience_level": "Fresher / 0-2 yrs"
    },
    {
        "id": "jooble-107",
        "title": "QA Automation Engineer (Selenium & Cypress)",
        "company": "QualiTech Global",
        "location": "Chennai, India",
        "salary_range": "₹6,00,000 - ₹10,00,000 LPA",
        "job_type": "Full-time",
        "domain": "Testing",
        "description": "Perform automated API testing, E2E testing using PyTest, Selenium, and Cypress. Ensure high-quality software releases and CI integration.",
        "extracted_skills": ["Selenium", "PyTest", "Cypress", "Postman", "API Testing", "Git"],
        "experience_level": "Fresher / 0-1 yr"
    },
    {
        "id": "jooble-108",
        "title": "Backend Software Engineer (Python & PostgreSQL)",
        "company": "FinTech Core Technologies",
        "location": "Bengaluru, India (Hybrid)",
        "salary_range": "₹9,00,000 - ₹16,00,000 LPA",
        "job_type": "Hybrid",
        "domain": "Backend",
        "description": "Build high-concurrency microservices, async queue pipelines with Celery/Redis, SQLAlchemy ORM, and optimized database indexing.",
        "extracted_skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Celery", "SQLAlchemy", "System Design"],
        "experience_level": "Fresher / 0-2 yrs"
    }
]

class JoobleService:
    def __init__(self):
        self.api_key = settings.JOOBLE_API_KEY
        self.base_url = f"https://jooble.org/api/{self.api_key}" if self.api_key else ""

    async def fetch_fresher_jobs(self, keywords: str = "software engineer fresher", location: str = "India") -> List[Dict[str, Any]]:
        """Fetches jobs from Jooble API or returns fallback database."""
        if not self.api_key:
            logger.info("Jooble API key not set. Using curated hackathon fallback job database.")
            return FALLBACK_JOBS

        payload = {
            "keywords": keywords,
            "location": location,
            "page": "1"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(self.base_url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    jobs_raw = data.get("jobs", [])
                    return self._normalize_jooble_jobs(jobs_raw)
                else:
                    logger.error(f"Jooble API returned status {response.status_code}. Using fallback.")
                    return FALLBACK_JOBS
        except Exception as e:
            logger.exception(f"Jooble API fetch error: {e}")
            return FALLBACK_JOBS

    def _normalize_jooble_jobs(self, raw_jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for idx, item in enumerate(raw_jobs):
            normalized.append({
                "id": str(item.get("id", f"jooble-live-{idx}")),
                "title": item.get("title", "Software Engineer"),
                "company": item.get("company", "Tech Company"),
                "location": item.get("location", "Remote / India"),
                "salary_range": item.get("salary", "Competitive / Market Standard"),
                "job_type": "Full-time",
                "domain": "Full Stack",
                "description": item.get("snippet", "Exciting software engineering role for freshers and early career talent."),
                "extracted_skills": ["Python", "JavaScript", "SQL", "Git", "Problem Solving"],
                "experience_level": "Fresher / 0-2 yrs"
            })
        return normalized

jooble_service = JoobleService()
