from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from resume_module.extractor import extract_text_from_pdf
from resume_module.analyzer import extract_information
from resume_module.scorer import calculate_ats_score
from resume_module.matcher import match_resume_with_job

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/")
def home():
    return "AI Resume Analyzer Backend is Running!"


@app.route("/analyze", methods=["POST"])
def analyze_resume():

    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400

    file = request.files["resume"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Extract text
    resume_text = extract_text_from_pdf(file_path)

    # Analyze resume
    information = extract_information(resume_text)

    # Calculate ATS score
    ats_score = calculate_ats_score(resume_text)

    # Job description
    job_description = request.form.get("job_description", "")

    match_score = 0

    if job_description:
        match_score = match_resume_with_job(
            resume_text,
            job_description
        )

    return jsonify({
        "message": "Resume analyzed successfully",
        "information": information,
        "ats_score": ats_score,
        "job_match_score": match_score
    })


if __name__ == "__main__":
    app.run(debug=True)