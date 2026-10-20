import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";
import ScholarshipDetails from "./pages/ScholarshipDetails";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function Home() {
  return (
    <div className="app">
      <div className="container">

        <div className="logo">
          Scholar<span>AI</span>
        </div>

        <p className="subtitle">
          Smart Scholarship Management System
        </p>

        <div className="buttons">

          <Link to="/student-login">
            <button className="btn">
              Student Login
            </button>
          </Link>

          <Link to="/student-register">
            <button className="btn secondary">
              Student Register
            </button>
          </Link>

          <Link to="/admin-dashboard">
            <button className="btn secondary">
              Admin Dashboard
            </button>
          </Link>

        </div>

      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/student-login"
          element={<StudentLogin />}
        />

        <Route
          path="/student-register"
          element={<StudentRegister />}
        />

        <Route
          path="/student-dashboard"
          element={<StudentDashboard />}
        />

        <Route
          path="/scholarship/:id"
          element={<ScholarshipDetails />}
        />

        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;