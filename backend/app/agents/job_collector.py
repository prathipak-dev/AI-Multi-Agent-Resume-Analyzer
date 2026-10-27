import logging
from typing import Dict, Any, List
from app.agents.state import AgentState
from app.services.jooble_service import jooble_service
from app.services.vector_service import vector_service

logger = logging.getLogger("JobCollectorAgent")

class JobCollectorAgent:
    """Agent 1: Discovers, normalizes, deduplicates, and vector-indexes jobs."""

    async def run(self, state: AgentState) -> AgentState:
        logger.info("Running Job Collector Agent...")
        target_domain = state.get("target_domain", "Full Stack")
        
        # 1. Discover jobs from Jooble API
        raw_jobs = await jooble_service.fetch_fresher_jobs(keywords=f"{target_domain} fresher", location="India")
        
        # 2. Deduplicate jobs based on ID / Company + Title hash
        seen_ids = set()
        deduped_jobs: List[Dict[str, Any]] = []

        for job in raw_jobs:
            job_id = job.get("id")
            if job_id not in seen_ids:
                seen_ids.add(job_id)
                
                # 3. Vector Index in ChromaDB
                job_text = f"{job['title']} at {job['company']}. {job['description']} Skills: {', '.join(job.get('extracted_skills', []))}"
                vector_service.upsert_job_embedding(
                    job_id=job_id,
                    text=job_text,
                    metadata={"title": job["title"], "company": job["company"], "domain": job.get("domain", target_domain)}
                )
                
                deduped_jobs.append(job)

        state["job_list"] = deduped_jobs
        state["current_step"] = "job_collection_complete"
        return state

job_collector_agent = JobCollectorAgent()
