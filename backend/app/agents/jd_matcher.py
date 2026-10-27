"""
Job Description Matching Agent
Transparent, documented scoring with keyword analysis and section recommendations.
"""
import re
import logging
from typing import Dict, Any, List

from app.services.groq_service import groq_service

logger = logging.getLogger("JDMatchingAgent")

# ─────────────────────────────────────────────
# Skill Extraction Helpers
# ─────────────────────────────────────────────

COMMON_TECH_TERMS = [
    # Languages
    "python", "javascript", "typescript", "java", "go", "golang", "rust", "c++", "c#", "ruby",
    "php", "swift", "kotlin", "scala", "r", "matlab", "bash", "shell",
    # Frontend
    "react", "next.js", "nextjs", "vue", "angular", "svelte", "html", "css", "tailwind",
    "sass", "less", "webpack", "vite", "redux", "zustand",
    # Backend
    "fastapi", "django", "flask", "express", "node.js", "nodejs", "spring", "rails",
    "laravel", "asp.net", "graphql", "rest", "restful",
    # Databases
    "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "cassandra",
    "dynamodb", "firebase", "neo4j", "supabase",
    # Cloud & DevOps
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "jenkins", "github actions",
    "ci/cd", "linux", "nginx", "ansible",
    # AI/ML
    "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "langchain", "langgraph",
    "openai", "groq", "huggingface", "rag", "vector", "embeddings",
    # Tools
    "git", "github", "jira", "figma", "postman", "selenium", "pytest", "jest",
]

def extract_keywords(text: str) -> List[str]:
    """Extract tech keywords from text using pattern matching."""
    text_lower = text.lower()
    found = []
    for term in COMMON_TECH_TERMS:
        # Word boundary match
        if re.search(rf'(?<![a-z]){re.escape(term)}(?![a-z])', text_lower):
            found.append(term)
    return list(set(found))


def extract_skills_from_text(text: str, parsed_skills: List[str]) -> List[str]:
    """Merge parsed skills with heuristic extraction."""
    heuristic = extract_keywords(text)
    parsed_lower = [s.lower() for s in parsed_skills]
    combined = list(set(heuristic + parsed_lower))
    return combined


# ─────────────────────────────────────────────
# Scoring Logic
# ─────────────────────────────────────────────

def calculate_keyword_overlap(
    resume_keywords: List[str],
    jd_keywords: List[str]
) -> Dict[str, Any]:
    """
    Transparent keyword matching score.
    Score = matched_required / total_required * 100
    NOT the same as ATS proprietary scores.
    """
    resume_set = set(k.lower() for k in resume_keywords)
    jd_set = set(k.lower() for k in jd_keywords)

    matched = resume_set.intersection(jd_set)
    missing = jd_set.difference(resume_set)

    if not jd_set:
        return {"score": 0, "matched": [], "missing": [], "coverage": 0}

    coverage = len(matched) / len(jd_set)
    score = round(coverage * 100, 1)

    return {
        "score": score,
        "matched": sorted(matched),
        "missing": sorted(missing),
        "coverage": round(coverage, 3)
    }


def calculate_experience_match(
    raw_text: str,
    jd_text: str
) -> Dict[str, Any]:
    """
    Check if experience level indicators in JD match resume content.
    """
    # Extract years of experience from JD
    jd_years_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience', jd_text, re.IGNORECASE)
    jd_years = int(jd_years_match.group(1)) if jd_years_match else None

    # Estimate years from resume (count distinct year ranges)
    resume_years_matches = re.findall(r'\b(20\d{2})\b', raw_text)
    if resume_years_matches:
        years = [int(y) for y in resume_years_matches]
        estimated_years = max(years) - min(years)
    else:
        estimated_years = 0

    if jd_years is None:
        return {"required": None, "estimated": estimated_years, "score": 75, "note": "No specific experience requirement found in JD."}
    elif estimated_years >= jd_years:
        return {"required": jd_years, "estimated": estimated_years, "score": 100, "note": f"Resume timespan ({estimated_years}y) meets JD requirement ({jd_years}y)."}
    elif estimated_years >= jd_years - 1:
        return {"required": jd_years, "estimated": estimated_years, "score": 70, "note": f"Resume slightly below JD's {jd_years}y requirement. Emphasize senior projects."}
    else:
        return {"required": jd_years, "estimated": estimated_years, "score": 40, "note": f"Resume ({estimated_years}y) significantly below JD's {jd_years}y requirement."}


def parse_required_vs_preferred(jd_text: str) -> Dict[str, List[str]]:
    """
    Try to separate 'Required' from 'Preferred/Nice-to-have' qualifications.
    """
    text_lower = jd_text.lower()

    # Find required section
    required_match = re.search(
        r'(?:required|must.have|minimum qualifications?|basic qualifications?)[:\s]*(.*?)(?:preferred|nice.to.have|bonus|additional|$)',
        text_lower, re.DOTALL | re.IGNORECASE
    )
    preferred_match = re.search(
        r'(?:preferred|nice.to.have|bonus|additional qualifications?)[:\s]*(.*?)(?:\n\n|$)',
        text_lower, re.DOTALL | re.IGNORECASE
    )

    required_text = required_match.group(1)[:500] if required_match else ""
    preferred_text = preferred_match.group(1)[:500] if preferred_match else ""

    required_skills = extract_keywords(required_text) if required_text else []
    preferred_skills = extract_keywords(preferred_text) if preferred_text else []

    return {
        "required": required_skills,
        "preferred": preferred_skills,
        "note": "Parsed from JD structure — verify manually for accuracy."
    }


# ─────────────────────────────────────────────
# Composite Score
# ─────────────────────────────────────────────

def calculate_match_score(
    keyword_score: float,
    experience_score: float,
) -> Dict[str, Any]:
    """
    Composite match score with documented weights.
    WARNING: This score is NOT equivalent to employer ATS scores.
    It is a resume-to-JD keyword and experience fit indicator.
    """
    weights = {
        "keyword_overlap": 0.70,
        "experience_level": 0.30,
    }
    total = (
        keyword_score * weights["keyword_overlap"] +
        experience_score * weights["experience_level"]
    )
    total = round(min(100, max(0, total)), 1)

    if total >= 80:
        rating = "Strong Match"
        color = "green"
    elif total >= 60:
        rating = "Good Fit"
        color = "yellow"
    elif total >= 40:
        rating = "Partial Match"
        color = "orange"
    else:
        rating = "Weak Match"
        color = "red"

    return {
        "score": total,
        "rating": rating,
        "color": color,
        "weights": weights,
        "disclaimer": (
            "This score measures keyword and experience alignment between your resume "
            "and the job description. It is NOT the score used by employer ATS systems "
            "and does not predict interview outcomes."
        )
    }


# ─────────────────────────────────────────────
# Recommendations
# ─────────────────────────────────────────────

def generate_heuristic_recommendations(
    missing_keywords: List[str],
    matched_keywords: List[str],
    experience_match: Dict[str, Any]
) -> List[Dict[str, str]]:
    """Generate prioritized, concrete recommendations."""
    recs = []

    if missing_keywords:
        top_missing = missing_keywords[:5]
        recs.append({
            "priority": "high",
            "title": f"Add {len(missing_keywords)} missing keywords",
            "action": f"The following keywords from the JD are absent in your resume: {', '.join(top_missing)}. If you have experience with these, add them to your Skills section and demonstrate them in your bullets.",
        })

    if experience_match.get("score", 100) < 70:
        recs.append({
            "priority": "high",
            "title": "Experience level gap",
            "action": experience_match.get("note", ""),
        })

    if matched_keywords:
        recs.append({
            "priority": "medium",
            "title": f"Strengthen {len(matched_keywords)} matched keywords",
            "action": f"You already have: {', '.join(matched_keywords[:5])}. Make sure each is prominently demonstrated with measurable achievements in your bullets — not just listed in the skills section.",
        })

    recs.append({
        "priority": "low",
        "title": "Mirror JD language in your summary",
        "action": "Copy 2–3 key phrases directly from the job description's opening paragraph into your professional summary. This improves both ATS keyword matching and human readability.",
    })

    return recs


# ─────────────────────────────────────────────
# Main Entry Point
# ─────────────────────────────────────────────

async def run_jd_matching(
    raw_resume_text: str,
    jd_text: str,
    parsed_skills: List[str],
    target_domain: str = "Full Stack"
) -> Dict[str, Any]:
    """
    Run the full JD-to-resume matching pipeline.
    Returns transparent scoring, gap analysis, and prioritized recommendations.
    """
    logger.info("Running JD matching pipeline...")

    # Extract keywords from both
    resume_keywords = extract_skills_from_text(raw_resume_text, parsed_skills)
    jd_keywords = extract_keywords(jd_text)

    # Keyword overlap
    keyword_analysis = calculate_keyword_overlap(resume_keywords, jd_keywords)

    # Experience level match
    experience_match = calculate_experience_match(raw_resume_text, jd_text)

    # Required vs preferred
    qual_split = parse_required_vs_preferred(jd_text)

    # Match score
    match_result = calculate_match_score(
        keyword_analysis["score"],
        experience_match["score"]
    )

    # Heuristic recommendations
    heuristic_recs = generate_heuristic_recommendations(
        keyword_analysis["missing"],
        keyword_analysis["matched"],
        experience_match
    )

    # AI-powered section recommendations
    ai_recommendations = []
    ai_missing_analysis = []

    prompt = f"""
You are an expert technical recruiter.

Compare this resume with the job description. Return JSON with:
1. "section_recommendations": list of {{section, recommendation}} for up to 4 resume sections to improve
2. "keyword_gaps": list of up to 5 important JD keywords missing from resume, each with {{keyword, importance: "required"|"preferred", note}}
3. "strengths": list of up to 3 resume strengths that match this JD

Resume skills: {', '.join(parsed_skills[:20])}
Resume text (first 2500 chars): {raw_resume_text[:2500]}

Job Description (first 2500 chars): {jd_text[:2500]}

Return JSON: {{"section_recommendations": [...], "keyword_gaps": [...], "strengths": [...]}}
"""

    try:
        ai_result = await groq_service.generate_json(
            prompt,
            system_prompt="You are a strict technical recruiter. Only reference information actually present in the resume and JD. Never invent skills or experience.",
            max_tokens=1200
        )
        ai_section_recs = ai_result.get("section_recommendations", [])
        ai_missing_analysis = ai_result.get("keyword_gaps", [])
        ai_strengths = ai_result.get("strengths", [])
    except Exception as e:
        logger.warning(f"AI JD analysis failed: {e}")
        ai_section_recs = []
        ai_missing_analysis = []
        ai_strengths = []

    return {
        "match_score": match_result,
        "keyword_analysis": {
            "resume_keywords": resume_keywords[:30],
            "jd_keywords": jd_keywords[:30],
            "matched": keyword_analysis["matched"],
            "missing_from_resume": keyword_analysis["missing"],
            "coverage_pct": keyword_analysis["score"]
        },
        "experience_match": experience_match,
        "qualifications": qual_split,
        "strengths": ai_strengths,
        "missing_skills": {
            "heuristic": keyword_analysis["missing"][:10],
            "ai_analysis": ai_missing_analysis[:5],
            "note": "Skills marked 'missing' may simply not be demonstrated in the resume, rather than genuinely absent from your knowledge."
        },
        "recommendations": heuristic_recs + [
            {"priority": r.get("priority", "medium"), "title": r.get("section", ""), "action": r.get("recommendation", "")}
            for r in ai_section_recs if r.get("recommendation")
        ],
        "analysis_version": "2.0"
    }
