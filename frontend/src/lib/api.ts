import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Intercept 401s to clear stale token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }
};

export const isAuthenticated = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("access_token");
  if (!token || token === "undefined" || token === "null") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) { localStorage.removeItem("access_token"); return false; }
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) { localStorage.removeItem("access_token"); return false; }
    return true;
  } catch {
    localStorage.removeItem("access_token");
    return false;
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardData = async () => {
  const res = await api.get("/dashboard/metrics");
  return res.data;
};

// ─── Resume ───────────────────────────────────────────────────────────────────
export const uploadResume = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/resume/upload", formData);
  return res.data;
};

export const getLatestResume = async () => {
  const res = await api.get("/resume/latest");
  return res.data;
};

export const getResumeHistory = async () => {
  const res = await api.get("/resume/history");
  return res.data;
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const getJobs = async (params?: { query?: string; domain?: string; experience?: string }) => {
  const p = new URLSearchParams();
  if (params?.query) p.set("query", params.query);
  if (params?.domain && params.domain !== "All") p.set("domain", params.domain);
  if (params?.experience && params.experience !== "All") p.set("experience", params.experience);
  const res = await api.get(`/jobs/?${p}`);
  return res.data;
};

export const getBookmarks = async () => {
  const res = await api.get("/jobs/bookmarks");
  return res.data;
};

export const toggleBookmark = async (jobId: string) => {
  const res = await api.post("/jobs/bookmark", { job_id: jobId });
  return res.data;
};

// ─── Applications ─────────────────────────────────────────────────────────────
export const generateApplicationPackage = async (jobId: string) => {
  const res = await api.post("/application/generate", { job_id: jobId });
  return res.data;
};

export const getApplicationTracker = async () => {
  const res = await api.get("/application/tracker");
  return res.data;
};

export const updateApplicationStatus = async (id: string, status: string) => {
  const res = await api.patch("/application/status", { application_id: id, status });
  return res.data;
};

// ─── Advisor / Skill Gap ──────────────────────────────────────────────────────
export const getSkillGapData = async () => {
  const res = await api.get("/advisor/roadmap");
  return res.data;
};

// ─── Career Growth ────────────────────────────────────────────────────────────
export const getCareerGoals = async () => {
  const res = await api.get("/career/goals");
  return res.data;
};

export const saveCareerGoals = async (data: object) => {
  const res = await api.post("/career/goals", data);
  return res.data;
};

export const getProjectRecommendations = async () => {
  const res = await api.get("/career/recommendations");
  return res.data;
};

export const getInterviewPrep = async (role?: string) => {
  const params = role ? `?role=${encodeURIComponent(role)}` : "";
  const res = await api.get(`/career/interview-prep${params}`);
  return res.data;
};

// ─── Recruiter Connect ────────────────────────────────────────────────────────
export const getMyRecruiterProfile = async () => {
  const res = await api.get("/recruiter/profile/me");
  return res.data;
};

export const updateRecruiterProfile = async (data: object) => {
  const res = await api.put("/recruiter/profile/me", data);
  return res.data;
};

export const discoverCandidates = async (domain?: string) => {
  const params = domain ? `?domain=${encodeURIComponent(domain)}` : "";
  const res = await api.get(`/recruiter/candidates${params}`);
  return res.data;
};

export const sendConnection = async (targetUserId: string, message = "") => {
  const res = await api.post("/recruiter/connect", { target_user_id: targetUserId, message });
  return res.data;
};

export const getConnections = async () => {
  const res = await api.get("/recruiter/connections");
  return res.data;
};

export const respondToConnection = async (connectionId: string, action: "accept" | "decline") => {
  const res = await api.post("/recruiter/connections/respond", { connection_id: connectionId, action });
  return res.data;
};

// ─── Matching ─────────────────────────────────────────────────────────────────
export const runMatchingPipeline = async () => {
  const res = await api.post("/matches/run");
  return res.data;
};
