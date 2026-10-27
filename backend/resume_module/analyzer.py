import re


def extract_information(text):
    information = {}

    # Section extraction
    sections = {
        "education": ["education", "academic background", "qualification"],
        "skills": ["skills", "technical skills", "key skills"],
        "projects": ["projects", "academic projects", "personal projects"],
        "experience": ["experience", "work experience", "employment"]
    }

    text_lower = text.lower()

    for section, keywords in sections.items():
        for keyword in keywords:
            if keyword in text_lower:
                information[section] = "Section found"
                break

    # Extract actual skills
    skills_match = re.search(
        r"(?is)(?:^|\n)\s*(?:skills|technical skills|key skills)\s*:?\s*\n(.*?)(?=\n\s*(?:education|projects|experience|work experience|employment)\s*:?\s*\n|\Z)",
        text
    )

    if skills_match:
        skills_text = skills_match.group(1)

        skills = [
            line.strip()
            for line in skills_text.splitlines()
            if line.strip()
        ]

        information["skills"] = skills

    return information