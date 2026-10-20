import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function StudentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await API.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      // --- Diagnostic logs (safe — no JWT or password logged) ---
      console.log("[ScholarAI] Login response status:", response.status);
      console.log("[ScholarAI] Response has token:", !!response.data.token);
      console.log("[ScholarAI] Response user:", {
        id: response.data.user?.id,
        email: response.data.user?.email,
        role: response.data.user?.role,
      });

      // --- Validate response before persisting ---
      if (!response.data.token || !response.data.user) {
        setError("Server error: login response is missing token or user data.");
        return;
      }
      if (!response.data.user.role) {
        setError("Server error: user role is missing in login response.");
        return;
      }

      // --- Persist to localStorage ---
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // --- Verify write succeeded ---
      const savedUser = localStorage.getItem("user");
      console.log("[ScholarAI] localStorage 'user' written:", savedUser !== null);
      console.log("[ScholarAI] Redirecting as role:", response.data.user.role);

      const role = (response.data.user.role || "").toLowerCase();

      if (role === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (role === "student") {
        navigate("/student-dashboard", { replace: true });
      } else {
        setError("Invalid user role assigned to this account.");
      }
    } catch (error) {
      console.error("[ScholarAI] Login failed:", error.response?.data || error.message);

      setError(
        error.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Student Login</h1>

        <p className="login-subtitle">
          Login to your ScholarAI account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentLogin;