"""
Deep Resume Analysis Engine
Modular, explainable pipeline with per-issue severity, suggested fixes, and section attribution.
"""
import re
import logging
from typing import Dict, Any, List, Optional

from app.services.groq_service import groq_service

logger = logging.getLogger("DeepResumeAnalyzer")

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────

WEAK_VERBS = {
    "worked", "helped", "assisted", "participated", "involved", "used",
    "did", "made", "got", "went", "handled", "managed tasks", "responsible for",
    "was responsible", "tried", "attempted", "contributed to", "part of team",
    "worked with", "worked on", "worked in", "helped with", "helped to",
    "was involved", "did some", "took part"
}

STRONG_VERBS = [
    "built", "architected", "engineered", "designed", "developed", "implemented",
    "launched", "delivered", "led", "directed", "created", "optimized", "reduced",
    "increased", "improved", "automated", "deployed", "integrated", "migrated",
    "refactored", "established", "generated", "saved", "accelerated"
]

ESSENTIAL_SECTIONS = {
    "contact": [r"email|phone|linkedin|github|portfolio|@"],
    "experience": [r"experience|employment|work history|internship|intern|position"],
    "education": [r"education|degree|university|college|bachelor|master|b\.tech|m\.tech|b\.e|m\.e|b\.sc|m\.sc"],
    "skills": [r"skills|technologies|tech stack|competencies|tools"],
    "projects": [r"projects|portfolio|personal projects|academic projects|side projects"],
}

METRIC_PATTERNS = [
    r'\d+\s*%',          # percentages
    r'\$\s*[\d,]+',      # dollar amounts
    r'₹\s*[\d,]+',       # rupee amounts
    r'\d+\s*(?:users?|customers?|clients?|requests?|queries|transactions|services?)',
    r'\d+\s*(?:hours?|days?|weeks?|months?|minutes?)',
    r'(?:over|more than|up to|increased|reduced|improved|decreased|saved|generated)\s+\d+',
    r'\d+\s*(?:bugs?|issues?|tickets?|features?|tasks?|deployments?)',
    r'(?:first|second|third|\d+(?:st|nd|rd|th))\s+(?:place|rank|position)',
    r'\d+\s*(?:lpa|lakhs?|crores?|thousand|million|billion)',
]

ATS_RISK_PATTERNS = [
    (r'\|\s*\|', "Table separator detected — ATS may fail to parse table-formatted content"),
    (r'[■●◆★→←↑↓]', "Special bullet/arrow characters may not parse correctly in ATS"),
    (r'header|footer', "Headers and footers may be stripped by ATS scanners"),
    (r'(?:text box|textbox|image)', "Text boxes and images are invisible to ATS parsers"),
    (r'\.{5,}', "Dot leaders (......) are ATS unfriendly"),
    (r'(?:curriculum vitae|c\.v\.)', "Use 'Resume' rather than 'Curriculum Vitae' for US/tech market"),
]

FILLER_PHRASES = [
    "passionate about", "hardworking individual", "team player", "go-getter",
    "self-motivated", "detail-oriented", "excellent communication skills",
    "strong work ethic", "quick learner", "results-driven", "dynamic professional",
    "seeking a challenging position", "to obtain a position", "references available",
    "references available upon request", "responsible for", "duties included",
    "duties include", "job responsibilities", "duties and responsibilities"
]

# ─────────────────────────────────────────────
# Heuristic Analysis Functions
# ─────────────────────────────────────────────

def detect_section_presence(text: str) -> Dict[str, bool]:
    text_lower = text.lower()
    found = {}
    for section, patterns in ESSENTIAL_SECTIONS.items():
        found[section] = any(re.search(p, text_lower) for p in patterns)
    return found


def detect_contact_info(text: str) -> Dict[str, bool]:
    return {
        "email": bool(re.search(r'[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}', text)),
        "phone": bool(re.search(r'(?:\+?\d[\d\s\-().]{7,15})', text)),
        "linkedin": bool(re.search(r'linkedin\.com/in/', text, re.IGNORECASE)),
        "github": bool(re.search(r'github\.com/', text, re.IGNORECASE)),
    }


def find_weak_verb_bullets(text: str) -> List[Dict[str, str]]:
    """Find bullet points that start with weak verbs."""
    issues = []
    bullet_pattern = re.compile(r'^[•\-*>]\s*(.+)', re.MULTILINE)
    for m in bullet_pattern.finditer(text):
        line = m.group(1).strip()
        words = line.lower().split()
        if words:
            first_word = words[0].rstrip('.,')
            # Check first 1-2 words for weak phrases
            first_two = ' '.join(words[:2]).rstrip('.,')
            if first_word in WEAK_VERBS or first_two in WEAK_VERBS:
                issues.append({
                    "text": line[:120],
                    "weak_verb": first_word if first_word in WEAK_VERBS else first_two
                })
    return issues[:5]  # Limit to top 5


def find_bullets_without_metrics(text: str) -> List[str]:
    """Find bullet points that have no measurable outcomes."""
    bullet_pattern = re.compile(r'^[•\-*>]\s*(.+)', re.MULTILINE)
    missing = []
    for m in bullet_pattern.finditer(text):
        line = m.group(1).strip()
        if len(line) > 30:  # ignore very short lines
            has_metric = any(re.search(p, line) for p in METRIC_PATTERNS)
            if not has_metric:
                missing.append(line[:120])
    return missing[:5]  # Top 5 offenders


def detect_ats_risks(text: str) -> List[Dict[str, str]]:
    risks = []
    for pattern, message in ATS_RISK_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            risks.append({"risk": message, "severity": "medium"})
    return risks


def detect_filler_phrases(text: str) -> List[str]:
    text_lower = text.lower()
    found = []
    for phrase in FILLER_PHRASES:
        if phrase in text_lower:
            found.append(phrase)
    return found


def check_date_consistency(text: str) -> List[str]:
    """Detect mixed date formats."""
    formats = []
    if re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}', text):
        formats.append("abbreviated month (Jan 2023)")
    if re.search(r'\b\d{1,2}/\d{4}', text):
        formats.append("numeric month/year (01/2023)")
    if re.search(r'\b\d{4}-\d{2}', text):
        formats.append("ISO format (2023-01)")
    if re.search(r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}', text):
        formats.append("full month name (January 2023)")
    return formats if len(formats) > 1 else []


def estimate_resume_length(text: str) -> Dict[str, Any]:
    words = len(text.split())
    lines = len([l for l in text.split('\n') if l.strip()])
    if words < 200:
        verdict = "too_short"
        message = f"Resume has only ~{words} words. Most recruiters expect 400–700 words for entry-level and 600–900 for experienced."
    elif words > 1200:
        verdict = "too_long"
        message = f"Resume has ~{words} words. Consider trimming to under 900 words for a 1-page focused resume."
    else:
        verdict = "good"
        message = f"Resume length ({words} words) is within the recommended range."
    return {"words": words, "lines": lines, "verdict": verdict, "message": message}


def check_skills_section(text: str, parsed_skills: List[str]) -> Dict[str, Any]:
    skills_section_present = bool(re.search(
        r'(?:skills|technologies|tech stack|competencies|tools)',
        text, re.IGNORECASE
    ))
    return {
        "skills_section_present": skills_section_present,
        "skills_count": len(parsed_skills),
        "low_skill_count": len(parsed_skills) < 5
    }


# ─────────────────────────────────────────────
# Issue Builder
# ─────────────────────────────────────────────

def build_issues(
    text: str,
    parsed_skills: List[str],
    parsed_experience: List[Any],
    parsed_education: List[Any],
    parsed_projects: List[Any],
    ai_issues: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Build a prioritized list of actionable resume issues."""
    issues = []
    issue_id = 0

    def add(title, section, severity, why, fix, example=None, affected_text=None):
        nonlocal issue_id
        issue_id += 1
        issues.append({
            "id": issue_id,
            "title": title,
            "section": section,
            "severity": severity,
            "why": why,
            "fix": fix,
            "example": example,
            "affected_text": affected_text,
            "status": "pending"  # pending | accepted | rejected
        })

    # ── Contact info ──
    contact = detect_contact_info(text)
    if not contact["email"]:
        add(
            "Email address missing",
            "Contact",
            "critical",
            "ATS systems and recruiters use email to contact candidates. A missing email means missed opportunities.",
            "Add your professional email address at the top of the resume.",
            "name@gmail.com or name@domain.com"
        )
    if not contact["phone"]:
        add(
            "Phone number missing",
            "Contact",
            "high",
            "Recruiters often call before emailing. A missing phone number creates unnecessary friction.",
            "Add a mobile number with country code at the top.",
            "+91 98765 43210"
        )
    if not contact["linkedin"]:
        add(
            "LinkedIn profile not linked",
            "Contact",
            "medium",
            "LinkedIn is checked by 87% of recruiters. Including it increases credibility.",
            "Add your LinkedIn profile URL: linkedin.com/in/your-name",
            "linkedin.com/in/yourname"
        )
    if not contact["github"] and parsed_skills:
        # Only flag for tech roles
        add(
            "GitHub profile not linked",
            "Contact",
            "medium",
            "For technical roles, GitHub demonstrates real work beyond what's described on paper.",
            "Add your GitHub profile URL if you have public repositories.",
            "github.com/yourhandle"
        )

    # ── Section presence ──
    sections = detect_section_presence(text)
    if not sections["experience"]:
        add(
            "Work/Internship Experience section missing",
            "Structure",
            "high",
            "Experience is the most-weighted section in ATS scoring and recruiter evaluation.",
            "Add an 'Experience' or 'Internships' section, even for part-time or freelance work."
        )
    if not sections["education"]:
        add(
            "Education section missing",
            "Structure",
            "high",
            "Most employers and ATS require education details for initial screening.",
            "Add an 'Education' section with your degree, institution, and graduation year."
        )
    if not sections["skills"]:
        add(
            "Skills section missing or unlabeled",
            "Structure",
            "high",
            "ATS parsers scan for a dedicated Skills section to extract keywords. Without it, you may score zero in keyword matching.",
            "Add a clearly labeled 'Skills' or 'Technical Skills' section.",
            "Skills: Python, React, FastAPI, PostgreSQL, Docker"
        )
    if not sections["projects"]:
        add(
            "Projects section missing",
            "Structure",
            "medium",
            "For early-career candidates, projects often substitute for professional experience and show practical ability.",
            "Add a 'Projects' section with 2–3 relevant projects, each with tech stack and outcomes."
        )

    # ── Weak verbs ──
    weak_bullets = find_weak_verb_bullets(text)
    for wb in weak_bullets[:3]:
        add(
            f"Weak action verb: '{wb['weak_verb']}'",
            "Experience / Projects",
            "medium",
            f"'{wb['weak_verb']}' is vague and passive. Strong verbs like 'Built', 'Delivered', or 'Optimized' create impact.",
            f"Replace '{wb['weak_verb']}' with a strong action verb that conveys ownership and outcome.",
            f"Instead of '{wb['text'][:60]}...', try: 'Built [solution] that [outcome with metric]'",
            wb["text"]
        )

    # ── Missing metrics ──
    no_metric_bullets = find_bullets_without_metrics(text)
    if len(no_metric_bullets) > 2:
        add(
            f"{len(no_metric_bullets)} bullet points lack measurable outcomes",
            "Experience / Projects",
            "high",
            "Quantified achievements (percentages, time saved, users served) are 40% more persuasive to hiring managers and ATS.",
            "Add at least one metric to each bullet. Use [X]% improvement, saved [N] hours, served [N] users, reduced by [X]ms.",
            "Instead of 'Improved API performance', use 'Reduced API response time by 60%, from 800ms to 320ms, serving 10K+ daily requests'",
            no_metric_bullets[0] if no_metric_bullets else None
        )

    # ── Filler phrases ──
    fillers = detect_filler_phrases(text)
    if fillers:
        add(
            f"Filler phrases detected: {', '.join(fillers[:3])}",
            "Summary / Objective",
            "medium",
            "Generic phrases like 'passionate about' and 'team player' add no information and dilute your ATS keyword density.",
            "Replace generic phrases with concrete skills, accomplishments, or numbers.",
            "Instead of 'Passionate about technology', use 'Built 3 full-stack applications using React and FastAPI'",
            ", ".join(fillers[:2])
        )

    # ── Date inconsistency ──
    mixed_dates = check_date_consistency(text)
    if mixed_dates:
        add(
            "Inconsistent date formats",
            "Experience / Education",
            "low",
            f"Multiple date formats detected: {', '.join(mixed_dates)}. Inconsistent formatting looks unprofessional.",
            "Choose one date format and apply it everywhere. Recommended: 'Jan 2022 – Mar 2023' or 'January 2022 – March 2023'.",
            "Jan 2022 – Present"
        )

    # ── ATS risks ──
    ats_risks = detect_ats_risks(text)
    for risk in ats_risks[:2]:
        add(
            "ATS parsing risk detected",
            "Formatting",
            risk["severity"],
            risk["risk"],
            "Remove or replace the problematic formatting element with plain text equivalents.",
        )

    # ── Length ──
    length_info = estimate_resume_length(text)
    if length_info["verdict"] == "too_short":
        add(
            "Resume is too brief",
            "Content",
            "high",
            length_info["message"],
            "Expand your experience bullets, add a summary section, and describe projects in more detail.",
        )
    elif length_info["verdict"] == "too_long":
        add(
            "Resume is too long",
            "Content",
            "low",
            length_info["message"],
            "Remove older or less relevant experience. Keep the most recent 5 years. Cut filler phrases.",
        )

    # ── Skills count ──
    skills_info = check_skills_section(text, parsed_skills)
    if skills_info["low_skill_count"]:
        add(
            "Skills section is sparse (fewer than 5 skills detected)",
            "Skills",
            "medium",
            "ATS keyword matching depends heavily on your skills list. Fewer than 5 skills severely limits matches.",
            "List all technologies you have used, including languages, frameworks, databases, and tools.",
            "Python, FastAPI, React, TypeScript, PostgreSQL, Docker, Git, REST APIs"
        )

    # ── AI-detected issues (from Groq) ──
    for ai_issue in ai_issues:
        if isinstance(ai_issue, dict) and ai_issue.get("title"):
            ai_issue["id"] = issue_id + 1
            ai_issue.setdefault("status", "pending")
            issues.append(ai_issue)
            issue_id += 1

    # Sort by severity
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    issues.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 3))

    return issues


# ─────────────────────────────────────────────
# Overall Score Calculator
# ─────────────────────────────────────────────

def calculate_deep_score(
    issues: List[Dict[str, Any]],
    parsed_skills: List[str],
    contact: Dict[str, bool],
    sections: Dict[str, bool],
    length_info: Dict[str, Any]
) -> Dict[str, Any]:
    """12-component weighted resume scoring."""
    components = {}

    # 1. Contact completeness (10%)
    contact_score = sum([
        contact.get("email", False) * 4,
        contact.get("phone", False) * 3,
        contact.get("linkedin", False) * 2,
        contact.get("github", False) * 1,
    ])
    components["contact"] = round((contact_score / 10) * 100)

    # 2. Section completeness (20%)
    section_weights = {"contact": 4, "experience": 6, "education": 5, "skills": 5, "projects": 4}
    section_score = sum(section_weights[s] * (1 if sections.get(s, False) else 0) for s in section_weights)
    components["sections"] = round((section_score / 24) * 100)

    # 3. Skills count (10%)
    skill_count = len(parsed_skills)
    if skill_count >= 10:
        components["skills"] = 100
    elif skill_count >= 5:
        components["skills"] = 70
    elif skill_count >= 2:
        components["skills"] = 40
    else:
        components["skills"] = 0

    # 4. Length/content volume (10%)
    verdict = length_info.get("verdict", "good")
    components["length"] = 100 if verdict == "good" else (50 if verdict == "too_long" else 20)

    # 5. Issue penalty (50%) — deduct per issue severity
    penalty = 0
    for issue in issues:
        sev = issue.get("severity", "low")
        penalty += {"critical": 20, "high": 10, "medium": 5, "low": 2}.get(sev, 0)
    issue_score = max(0, 100 - penalty)
    components["issue_score"] = issue_score

    # Weighted total
    weights = {
        "contact": 0.10,
        "sections": 0.20,
        "skills": 0.10,
        "length": 0.10,
        "issue_score": 0.50,
    }
    total = sum(components[k] * weights[k] for k in weights)
    total = round(min(100, max(0, total)), 1)

    return {
        "overall": total,
        "components": components,
        "issue_counts": {
            "critical": sum(1 for i in issues if i.get("severity") == "critical"),
            "high": sum(1 for i in issues if i.get("severity") == "high"),
            "medium": sum(1 for i in issues if i.get("severity") == "medium"),
            "low": sum(1 for i in issues if i.get("severity") == "low"),
            "total": len(issues)
        }
    }


# ─────────────────────────────────────────────
# Main Analysis Entry Point
# ─────────────────────────────────────────────

async def run_deep_analysis(
    raw_text: str,
    parsed_skills: List[str],
    parsed_experience: List[Any],
    parsed_education: List[Any],
    parsed_projects: List[Any],
    target_domain: str = "Full Stack"
) -> Dict[str, Any]:
    """
    Run the full deep resume analysis pipeline.
    Returns issues, score breakdown, and length stats.
    """
    logger.info("Running deep resume analysis pipeline...")

    # ── AI-powered issue detection ──
    ai_issues = []
    prompt = f"""
You are an expert resume reviewer for tech roles.

Analyze the following resume text and return a JSON object with key "issues" containing a list of up to 5 specific, actionable problems found.

Each issue must have:
- "title": short issue title (string)
- "section": which resume section (string)
- "severity": "critical", "high", "medium", or "low"
- "why": one sentence explaining why this matters
- "fix": specific actionable fix
- "example": an improved example (or null)
- "affected_text": the problematic text excerpt (or null)

Focus on:
1. Missing or vague professional summary
2. Poor project descriptions lacking technical depth
3. Education details that are incomplete
4. Skills that appear in the experience but are not listed in skills section
5. Bullet points that are too generic or lack technical depth

Target domain: {target_domain}

Resume text (first 4000 chars):
{raw_text[:4000]}

Return JSON: {{"issues": [...]}}
"""

    try:
        ai_result = await groq_service.generate_json(
            prompt,
            system_prompt="You are a strict, senior technical resume reviewer. Return only JSON. Be specific about issues — never invent fake content from the resume.",
            max_tokens=1500
        )
        ai_issues = ai_result.get("issues", [])
        if not isinstance(ai_issues, list):
            ai_issues = []
    except Exception as e:
        logger.warning(f"AI issue detection failed: {e}")
        ai_issues = []

    # ── Heuristic analysis ──
    contact = detect_contact_info(raw_text)
    sections = detect_section_presence(raw_text)
    length_info = estimate_resume_length(raw_text)

    # ── Build full issue list ──
    issues = build_issues(
        raw_text,
        parsed_skills,
        parsed_experience,
        parsed_education,
        parsed_projects,
        ai_issues
    )

    # ── Score ──
    score_data = calculate_deep_score(issues, parsed_skills, contact, sections, length_info)

    return {
        "issues": issues,
        "score": score_data,
        "contact_detected": contact,
        "sections_detected": sections,
        "length": length_info,
        "target_domain": target_domain,
        "analysis_version": "2.0"
    }
