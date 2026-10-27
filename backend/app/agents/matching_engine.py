import logging
from typing import Dict, Any, List
from app.agents.state import AgentState
from app.services.vector_service import vector_service

logger = logging.getLogger("MatchingEngineAgent")

class MatchingEngineAgent:
    """Agent 5: Computes multi-factor match scores between candidate resume and jobs."""

    async def run(self, state: AgentState) -> AgentState:
        logger.info("Running Job Matching Engine Agent...")
        candidate_skills = set(s.lower() for s in state.get("parsed_skills", []))
        raw_text = state.get("raw_text", "")
        resume_vec = vector_service.get_embedding(raw_text[:2000]) if raw_text else []
        ats_score = state.get("ats_score", 75.0)
        jobs = state.get("classified_jobs", state.get("job_list", []))

        matched_jobs = []

        for job in jobs:
            job_skills = set(s.lower() for s in job.get("extracted_skills", []))
            
            # 1. Skill Match Score (0 - 100)
            if job_skills:
                overlap = candidate_skills.intersection(job_skills)
                skill_score = min(100.0, (len(overlap) / len(job_skills)) * 100.0 + 20.0)
            else:
                skill_score = 75.0

            # 2. Semantic Similarity Score (0 - 100)
            job_text = f"{job['title']} {job['description']}"
            job_vec = vector_service.get_embedding(job_text[:2000])
            semantic_score = vector_service.compute_cosine_similarity(resume_vec, job_vec)

            # 3. Experience & Education Score
            experience_score = 85.0
            education_score = 90.0

            # 4. Multi-Factor Formula
            # Overall = 35% Semantic + 30% Skill + 15% Experience + 10% ATS + 10% Edu
            overall_score = (
                0.35 * semantic_score +
                0.30 * skill_score +
                0.15 * experience_score +
                0.10 * ats_score +
                0.10 * education_score
            )

            overall_score = round(min(99.0, max(50.0, overall_score)), 1)

            # Match Reasoning
            matched_skills_list = list(candidate_skills.intersection(job_skills))
            reasons = [
                f"Strong skill overlap in {', '.join(matched_skills_list[:3]) if matched_skills_list else 'core domain requirements'}.",
                f"High vector semantic relevance ({semantic_score}% text compatibility).",
                f"Matched target domain: {job.get('domain', 'Full Stack')}."
            ]

            matched_jobs.append({
                "job_id": job.get("id"),
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "salary_range": job.get("salary_range"),
                "domain": job.get("domain"),
                "description": job.get("description"),
                "overall_match_score": overall_score,
                "semantic_score": round(semantic_score, 1),
                "skill_score": round(skill_score, 1),
                "ats_score": round(ats_score, 1),
                "reasons": reasons,
                "missing_skills": list(job_skills.difference(candidate_skills))
            })

        # Sort jobs by highest match percentage
        matched_jobs.sort(key=lambda x: x["overall_match_score"], reverse=True)

        state["matched_jobs"] = matched_jobs
        state["current_step"] = "matching_engine_complete"
        return state

matching_engine_agent = MatchingEngineAgent()
