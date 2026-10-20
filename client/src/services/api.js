// ScholarAI API Service
// Base URL points to the Express server running on port 5000

import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});


// -------------------------------------------------------
// Request Interceptor — attach JWT token to every request
// -------------------------------------------------------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------------------------------
// Response Interceptor — handle 401 globally
// -------------------------------------------------------
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/student-login";
    }
    return Promise.reject(error);
  }
);

// ===============================
// Auth Endpoints  →  /api/auth
// ===============================
export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser    = (data) => API.post("/auth/login", data);
export const getProfile   = ()     => API.get("/auth/profile");

// ===============================
// Admin Endpoints  →  /api/admin
// ===============================
export const getAllApplications  = ()     => API.get("/admin/applications");
export const getApplicationById  = (id)   => API.get(`/admin/applications/${id}`);
export const approveApplication  = (id)   => API.put(`/admin/applications/${id}/approve`);
export const rejectApplication   = (id)   => API.put(`/admin/applications/${id}/reject`);

// ===============================
// Student Endpoints  →  /api/student
// ===============================
export const getStudentDashboard      = ()     => API.get("/student/dashboard");
export const applyForScholarship      = (data) => API.post("/student/apply", data);
export const getMyApplications        = ()     => API.get("/student/applications");
export const getMyApplicationById     = (id)   => API.get(`/student/applications/${id}`);

// ===============================
// Scholarship Endpoints  →  /api/scholarships
// ===============================
export const getAllScholarships  = ()   => API.get("/scholarships");
export const getScholarshipById = (id) => API.get(`/scholarships/${id}`);

export default API;
