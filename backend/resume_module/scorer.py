def calculate_ats_score(resume_text):
    """
    Calculate a basic ATS score based on resume content.
    """

    score = 0
    text = resume_text.lower()

    # Important sections
    sections = [
        "education",
        "skills",
        "projects",
        "experience",
        "certifications"
    ]

    for section in sections:
        if section in text:
            score += 10

    # Common technical skills
    skills = [
        "python",
        "java",
        "javascript",
        "react",
        "sql",
        "html",
        "css",
        "machine learning",
        "data structures"
    ]

    for skill in skills:
        if skill in text:
            score += 5

    # Contact information
    if "@" in text:
        score += 5

    # Limit score to 100
    score = min(score, 100)

    return score