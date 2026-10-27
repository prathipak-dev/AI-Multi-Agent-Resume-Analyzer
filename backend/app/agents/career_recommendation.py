import logging
from typing import Dict, Any, List
from app.agents.state import AgentState
from app.services.groq_service import groq_service

logger = logging.getLogger("CareerRecommendationAgent")

class CareerRecommendationAgent:
    """Agent 7: Generates tailored interview preparation kits (Tech, Coding, HR STAR answers)."""

    async def run(self, state: AgentState) -> AgentState:
        logger.info("Running Career Recommendation & Interview Advisor Agent...")
        skills = ", ".join(state.get("parsed_skills", ["Python", "FastAPI", "React"]))
        target_domain = state.get("target_domain", "Full Stack")

        prompt = f"""
        Generate 3 high-frequency technical interview questions and STAR-method model answers for:
        Target Domain: {target_domain}
        Candidate Skills: {skills}

        Respond in JSON format:
        {{
            "questions": [
                {{"category": "Technical", "question": "Question 1", "answer": "Model STAR Answer"}},
                {{"category": "Coding / System Design", "question": "Question 2", "answer": "Model STAR Answer"}},
                {{"category": "HR / Behavioral", "question": "Question 3", "answer": "Model STAR Answer"}}
            ]
        }}
        """

        llm_data = await groq_service.generate_json(prompt, system_prompt="You are a Staff Technical Hiring Manager at Google / OpenAI.")

        questions = llm_data.get("questions", [
            {
                "category": "Technical Architecture",
                "question": "How do you handle rate-limiting and asynchronous background tasks in FastAPI?",
                "answer": "S (Situation): In high-traffic microservices. T (Task): Prevent database exhaustion. A (Action): Integrated Redis sliding window rate-limiting middleware and Celery background workers. R (Result): Achieved sub-50ms latency for 10,000+ concurrent requests."
            },
            {
                "category": "Agentic AI & Vector DB",
                "question": "Explain how LangGraph manages state transitions vs CrewAI.",
                "answer": "S (Situation): Building complex agent workflows. T (Task): Ensure deterministic execution. A (Action): Selected LangGraph StateGraph to maintain explicit TypedDict state, parallel fan-out nodes, and thread checkpoints. R (Result): Eliminates non-deterministic looping and ensures fault tolerance."
            },
            {
                "category": "Behavioral / Leadership",
                "question": "Describe a time when you had to learn a new technology under tight hackathon deadlines.",
                "answer": "S (Situation): IIT Hackathon project requirement. T (Task): Master ChromaDB vector search in 6 hours. A (Action): Studied docs, created vector wrapper service, and implemented cosine similarity fallback. R (Result): Delivered production pipeline and won hackathon."
            }
        ])

        state["interview_questions"] = questions
        state["current_step"] = "career_recommendation_complete"
        return state

career_recommendation_agent = CareerRecommendationAgent()
