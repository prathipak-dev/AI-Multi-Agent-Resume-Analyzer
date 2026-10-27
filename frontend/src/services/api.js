const API_URL = "http://127.0.0.1:5000";

export const analyzeResume = async (resumeFile, jobDescription) => {
  const formData = new FormData();

  formData.append("resume", resumeFile);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Resume analysis failed");
  }

  return data;
};