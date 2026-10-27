import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.job_collector import job_collector_agent
from app.agents.domain_classifier import domain_classifier_agent
from app.agents.resume_intelligence import resume_intelligence_agent
from app.agents.skill_gap import skill_gap_agent
from app.agents.matching_engine import matching_engine_agent
from app.agents.personalized_application import personalized_application_agent
from app.agents.career_recommendation import career_recommendation_agent

logger = logging.getLogger("CoordinatorGraph")

# Initialize LangGraph StateGraph with AgentState TypedDict
workflow = StateGraph(AgentState)

# 1. Define Nodes
async def node_resume_intelligence(state: AgentState) -> AgentState:
    return await resume_intelligence_agent.run(state)

async def node_job_collector(state: AgentState) -> AgentState:
    return await job_collector_agent.run(state)

async def node_domain_classifier(state: AgentState) -> AgentState:
    return await domain_classifier_agent.run(state)

async def node_matching_engine(state: AgentState) -> AgentState:
    return await matching_engine_agent.run(state)

async def node_skill_gap(state: AgentState) -> AgentState:
    return await skill_gap_agent.run(state)

async def node_personalized_application(state: AgentState) -> AgentState:
    return await personalized_application_agent.run(state)

async def node_career_recommendation(state: AgentState) -> AgentState:
    return await career_recommendation_agent.run(state)

# 2. Add Nodes to Graph
workflow.add_node("resume_intelligence", node_resume_intelligence)
workflow.add_node("job_collector", node_job_collector)
workflow.add_node("domain_classifier", node_domain_classifier)
workflow.add_node("matching_engine", node_matching_engine)
workflow.add_node("skill_gap", node_skill_gap)
workflow.add_node("personalized_application", node_personalized_application)
workflow.add_node("career_recommendation", node_career_recommendation)

# 3. Define Entrypoint and Edges
workflow.set_entry_point("resume_intelligence")

workflow.add_edge("resume_intelligence", "job_collector")
workflow.add_edge("job_collector", "domain_classifier")
workflow.add_edge("domain_classifier", "matching_engine")
workflow.add_edge("matching_engine", "skill_gap")
workflow.add_edge("skill_gap", "personalized_application")
workflow.add_edge("personalized_application", "career_recommendation")
workflow.add_edge("career_recommendation", END)

# Compile Graph App
coordinator_graph = workflow.compile()

class CoordinatorAgent:
    """Agent 8: Orchestrates the multi-agent execution pipeline via LangGraph."""

    async def execute_pipeline(self, initial_state: AgentState) -> AgentState:
        logger.info("Executing LangGraph Multi-Agent Career Intelligence Graph Pipeline...")
        try:
            final_state = await coordinator_graph.ainvoke(initial_state)
            return final_state
        except Exception as e:
            logger.exception(f"Error in LangGraph workflow execution: {e}")
            initial_state["error"] = str(e)
            return initial_state

coordinator_agent = CoordinatorAgent()
