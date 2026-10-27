import pytest
from app.services.vector_service import vector_service
from app.agents.matching_engine import matching_engine_agent
from app.agents.domain_classifier import domain_classifier_agent

def test_cosine_similarity():
    vec1 = [1.0, 0.0, 0.0]
    vec2 = [1.0, 0.0, 0.0]
    sim = vector_service.compute_cosine_similarity(vec1, vec2)
    assert sim == 100.0

    vec3 = [0.0, 1.0, 0.0]
    sim2 = vector_service.compute_cosine_similarity(vec1, vec3)
    assert sim2 == 50.0

@pytest.mark.asyncio
async def test_domain_classifier():
    state = {
        "job_list": [
            {"id": "1", "title": "DevOps Engineer", "description": "Experience with Docker, Kubernetes, AWS."},
            {"id": "2", "title": "AI/ML Developer", "description": "LangGraph, RAG, PyTorch expertise."}
        ]
    }
    result = await domain_classifier_agent.run(state)
    classified = result["classified_jobs"]
    assert classified[0]["domain"] == "DevOps"
    assert classified[1]["domain"] == "AI/ML"
