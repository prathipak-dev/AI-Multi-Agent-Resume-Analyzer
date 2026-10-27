def match_resume_with_job(resume_text, job_description):
    """
    Compare resume text with job description
    and calculate a simple keyword matching score.
    """

    resume_words = set(resume_text.lower().split())
    job_words = set(job_description.lower().split())

    # Remove very small/common words
    job_keywords = {
        word.strip(".,:;()[]{}")
        for word in job_words
        if len(word) > 3
    }

    if not job_keywords:
        return 0

    matched_keywords = resume_words.intersection(job_keywords)

    score = (len(matched_keywords) / len(job_keywords)) * 100

    return round(score, 2)