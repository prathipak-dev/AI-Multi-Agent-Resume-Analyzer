import logging
from typing import Dict, Any, List
from app.agents.state import AgentState
from app.services.groq_service import groq_service

logger = logging.getLogger("DomainClassifierAgent")

VALID_DOMAINS = [
    "Full Stack", "AI/ML", "Cyber Security", "DevOps", 
    "Testing", "Data Analyst", "UI/UX", "Backend", "Frontend"
]

class DomainClassifierAgent:
    """Agent 2: Classifies jobs into standardized tech domains."""

    async def run(self, state: AgentState) -> AgentState:
        logger.info("Running Job Domain Classifier Agent...")
        jobs = state.get("job_list", [])
        classified = []

        for job in jobs:
            title_lower = job.get("title", "").lower()
            desc_lower = job.get("description", "").lower()
            
            # Fast deterministic keyword matching first
            assigned_domain = "Full Stack"
            if any(k in title_lower or k in desc_lower for k in ["ai", "machine learning", "ml", "langgraph", "rag"]):
                assigned_domain = "AI/ML"
            elif any(k in title_lower or k in desc_lower for k in ["devops", "cloud", "docker", "kubernetes"]):
                assigned_domain = "DevOps"
            elif any(k in title_lower or k in desc_lower for k in ["security", "cyber", "penetration", "owasp"]):
                assigned_domain = "Cyber Security"
            elif any(k in title_lower or k in desc_lower for k in ["data analyst", "bi", "tableau", "powerbi"]):
                assigned_domain = "Data Analyst"
            elif any(k in title_lower or k in desc_lower for k in ["ui", "ux", "design", "figma"]):
                assigned_domain = "UI/UX"
            elif any(k in title_lower or k in desc_lower for k in ["qa", "testing", "selenium", "cypress"]):
                assigned_domain = "Testing"
            elif "backend" in title_lower:
                assigned_domain = "Backend"
            elif "frontend" in title_lower or "react" in title_lower:
                assigned_domain = "Frontend"

            job["domain"] = assigned_domain
            classified.append(job)

        state["classified_jobs"] = classified
        state["current_step"] = "domain_classification_complete"
        return state

domain_classifier_agent = DomainClassifierAgent()
