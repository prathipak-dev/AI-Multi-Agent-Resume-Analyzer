import { useState } from "react";
import { analyzeResume } from "../services/api";

function ResumeUpload({ onResult }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!resumeFile) {
      setError("Please select a resume PDF.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await analyzeResume(
        resumeFile,
        jobDescription
      );

      onResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Upload Resume (PDF)</label>
        <br />

        <input
          type="file"
          accept=".pdf"
          onChange={(event) => {
            setResumeFile(event.target.files[0]);
            setError("");
          }}
        />
      </div>

      <br />

      <div>
        <label>Job Description</label>
        <br />

        <textarea
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Enter job description"
          rows="6"
          cols="50"
        />
      </div>

      <br />

      <button type="submit" disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}
    </form>
  );
}

export default ResumeUpload;