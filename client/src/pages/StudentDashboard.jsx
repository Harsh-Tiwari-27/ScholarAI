
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

function StudentDashboard() {
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [scholarships, setScholarships] = useState([]);
    const [applications, setApplications] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token) {
            navigate("/student-login", { replace: true });
            return;
        }

        if (storedUser) {
            try {
                setStudent(JSON.parse(storedUser));
            } catch (err) {
                console.error("Failed to parse student:", err);
            }
        }

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError("");

                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                const [scholarshipResponse, applicationResponse] =
                    await Promise.all([
                        fetch(
                            "/api/scholarships",
                            { headers }
                        ),
                        fetch(
                            "/api/student/applications",
                            { headers }
                        ),
                    ]);

                const scholarshipData =
                    await scholarshipResponse.json();

                const applicationData =
                    await applicationResponse.json();

                if (scholarshipResponse.status === 401 ||
                    applicationResponse.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/student-login", { replace: true });
                    return;
                }

                if (scholarshipResponse.ok) {
                    setScholarships(
                        Array.isArray(scholarshipData.scholarships)
                            ? scholarshipData.scholarships
                            : []
                    );
                } else {
                    console.error(
                        "Scholarship API error:",
                        scholarshipData.message
                    );
                    setError("Unable to load scholarships.");
                }

                if (applicationResponse.ok) {
                    setApplications(
                        Array.isArray(applicationData.applications)
                            ? applicationData.applications
                            : []
                    );
                } else {
                    console.error(
                        "Applications API error:",
                        applicationData.message
                    );
                    setError((previous) =>
                        previous
                            ? previous + " Unable to load applications."
                            : "Unable to load applications."
                    );
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(
                    "Unable to connect to the backend server."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/student-login", { replace: true });
    };

    const pendingApplications = applications.filter(
        (application) =>
            application.status?.toLowerCase() === "pending"
    ).length;

    const approvedApplications = applications.filter(
        (application) =>
            application.status?.toLowerCase() === "approved"
    ).length;

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getDaysLeft = (deadline) => {
        const deadlineDate = new Date(deadline);

        if (Number.isNaN(deadlineDate.getTime())) {
            return "Deadline unavailable";
        }

        const difference = deadlineDate.getTime() - Date.now();

        if (difference <= 0) {
            return "Deadline Passed";
        }

        const days = Math.ceil(
            difference / (1000 * 60 * 60 * 24)
        );

        return `${days} Days Left`;
    };

    return (
        <div className="dashboard">

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <h2>ScholarAI</h2>
                    <p>Student Portal</p>
                </div>

                <nav className="sidebar-menu">
                    <a
                        href="/student-dashboard"
                        className="active"
                    >
                        🏠 Dashboard
                    </a>

                    <a href="#scholarships">
                        🎓 Scholarships
                    </a>

                    <a href="#my-applications">
                        📄 My Applications
                    </a>

                    <a href="#profile">
                        👤 Profile
                    </a>
                </nav>

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">

                {/* Top Bar */}
                <header className="topbar" id="profile">
                    <div>
                        <h1>Student Dashboard</h1>
                        <p>
                            Welcome back to your ScholarAI account!
                        </p>
                    </div>

                    <div className="student-info">
                        <div className="avatar">
                            {student?.name
                                ? student.name.charAt(0).toUpperCase()
                                : "S"}
                        </div>

                        <div>
                            <strong>
                                {student?.name || "Student"}
                            </strong>
                            <span>Scholarship Applicant</span>
                        </div>
                    </div>
                </header>

                {/* API Error */}
                {error && (
                    <p
                        role="alert"
                        style={{
                            color: "#f87171",
                            marginBottom: "20px",
                        }}
                    >
                        {error}
                    </p>
                )}

                {/* Statistics */}
                <section className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-icon">🎓</div>
                        <div>
                            <p>Available Scholarships</p>
                            <h2>
                                {loading ? "..." : scholarships.length}
                            </h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📄</div>
                        <div>
                            <p>Applications Submitted</p>
                            <h2>
                                {loading ? "..." : applications.length}
                            </h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div>
                            <p>Pending Applications</p>
                            <h2>
                                {loading ? "..." : pendingApplications}
                            </h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div>
                            <p>Approved</p>
                            <h2>
                                {loading ? "..." : approvedApplications}
                            </h2>
                        </div>
                    </div>

                </section>

                {/* Scholarships */}
                <section className="section" id="scholarships">
                    <div className="section-header">
                        <div>
                            <h2>Available Scholarships</h2>
                            <p>
                                Find scholarships you are eligible for.
                            </p>
                        </div>

                        <button
                            className="view-all"
                            onClick={() =>
                                document
                                    .getElementById("scholarships")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                    })
                            }
                        >
                            View All
                        </button>
                    </div>

                    <div className="scholarship-grid">
                        {loading ? (
                            <p>Loading scholarships...</p>
                        ) : scholarships.length > 0 ? (
                            scholarships.map((scholarship) => (
                                <div
                                    className="scholarship-card"
                                    key={scholarship._id}
                                >
                                    <div className="scholarship-header">
                                        <span className="scholarship-tag">
                                            {scholarship.category ||
                                                "Scholarship"}
                                        </span>

                                        <span className="deadline">
                                            {getDaysLeft(
                                                scholarship.deadline
                                            )}
                                        </span>
                                    </div>

                                    <h3>{scholarship.name}</h3>

                                    <p>{scholarship.description}</p>

                                    <div className="scholarship-details">
                                        <span>
                                            💰 ₹
                                            {Number(
                                                scholarship.amount || 0
                                            ).toLocaleString("en-IN")}
                                        </span>

                                        <span>
                                            🎓{" "}
                                            {scholarship.target ||
                                                scholarship.provider ||
                                                "Not specified"}
                                        </span>
                                    </div>

                                    <button
                                        className="apply-btn"
                                        onClick={() =>
                                            navigate(
                                                `/scholarship/${scholarship._id}`
                                            )
                                        }
                                    >
                                        View Scholarship
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No scholarships available at the moment.</p>
                        )}
                    </div>
                </section>

                {/* Applications */}
                <section className="section" id="my-applications">
                    <div className="section-header">
                        <div>
                            <h2>My Applications</h2>
                            <p>
                                Track your scholarship applications.
                            </p>
                        </div>
                    </div>

                    <div className="application-table">
                        <div className="table-header">
                            <span>Scholarship</span>
                            <span>Applied On</span>
                            <span>Status</span>
                        </div>

                        {loading ? (
                            <div className="table-row">
                                <span>Loading applications...</span>
                                <span>—</span>
                                <span>—</span>
                            </div>
                        ) : applications.length > 0 ? (
                            applications.map((application) => (
                                <div
                                    className="table-row"
                                    key={
                                        application._id ||
                                        application.id
                                    }
                                >
                                    <span>
                                        {application.scholarship?.name ||
                                            "Scholarship unavailable"}
                                    </span>

                                    <span>
                                        {formatDate(
                                            application.createdAt
                                        )}
                                    </span>

                                    <span
                                        className={`status ${
                                            application.status?.toLowerCase() ||
                                            "pending"
                                        }`}
                                    >
                                        {application.status
                                            ? application.status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              application.status.slice(1)
                                            : "Pending"}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="table-row">
                                <span>No applications yet</span>
                                <span>—</span>
                                <span>—</span>
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
}

export default StudentDashboard;
