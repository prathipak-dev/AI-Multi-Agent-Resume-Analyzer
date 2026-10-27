import { useState } from "react";
import ResumeUpload from "./components/ResumeUpload";

function App() {
  const [result, setResult] = useState(null);

  return (
    <div>
      <h1>AI Resume Analyzer</h1>

      <ResumeUpload onResult={setResult} />

      {result && (
        <div>
          <h2>Analysis Result</h2>

          <h3>Resume Information</h3>
          <pre>
            {JSON.stringify(result.information, null, 2)}
          </pre>

          <h3>ATS Score</h3>
          <p>{result.ats_score}</p>

          <h3>Job Match Score</h3>
          <p>{result.job_match_score}</p>
        </div>
      )}
    </div>
  );
}

export default App;