
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [filter, setFilter] = useState("all");

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/student-login", { replace: true });
    };

    const fetchApplications = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/student-login", { replace: true });
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "/api/admin/applications",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setError(
                    response.status === 403
                        ? "Admin access required. Please log in with an admin account."
                        : "Your session has expired. Please log in again."
                );
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch applications"
                );
            }

            setApplications(data.applications || []);
        } catch (err) {
            console.error("Admin applications error:", err);
            setError(err.message || "Unable to connect to the server");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        // No credentials at all → send to login
        if (!storedUser || !token) {
            navigate("/student-login", { replace: true });
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            const userRole = (user?.role || "").toLowerCase();

            // If the logged-in user has role === "student", prevent admin access and redirect to student dashboard
            if (userRole === "student") {
                navigate("/student-dashboard", { replace: true });
                return;
            }

            // If not an admin account (missing, invalid, or unrecognized role), redirect to login
            if (userRole !== "admin") {
                navigate("/student-login", { replace: true });
                return;
            }
        } catch {
            // Corrupted user data in localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/student-login", { replace: true });
            return;
        }

        // Role confirmed as admin — safe to fetch
        fetchApplications();
    }, [fetchApplications, navigate]);

    const updateStatus = async (applicationId, status) => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/student-login", { replace: true });
            return;
        }

        const action = status === "approved" ? "approve" : "reject";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} this application?`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(applicationId);
            setError("");

            const response = await fetch(
                `/api/admin/applications/${applicationId}/${action}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || `Failed to ${action} application`
                );
            }

            await fetchApplications();
        } catch (err) {
            console.error("Update application status error:", err);
            setError(err.message || "Unable to update application status");
        } finally {
            setUpdatingId(null);
        }
    };

    const totalApplications = applications.length;

    const pendingCount = applications.filter(
        (application) => application.status?.toLowerCase() === "pending"
    ).length;

    const approvedCount = applications.filter(
        (application) => application.status?.toLowerCase() === "approved"
    ).length;

    const rejectedCount = applications.filter(
        (application) => application.status?.toLowerCase() === "rejected"
    ).length;

    const filteredApplications =
        filter === "all"
            ? applications
            : applications.filter(
                  (application) =>
                      application.status?.toLowerCase() === filter
              );

    const formatDate = (date) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "—";

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <h2>ScholarAI</h2>
                    <p>Admin Portal</p>
                </div>

                <nav className="admin-menu">
                    <a href="#overview" className="admin-menu-active">
                        📊 Dashboard
                    </a>
                    <a href="#applications">📄 Applications</a>
                </nav>

                <button className="admin-logout" onClick={logout}>
                    Logout
                </button>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar" id="overview">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p>Manage scholarship applications</p>
                    </div>

                    <button
                        className="admin-refresh"
                        onClick={fetchApplications}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "↻ Refresh"}
                    </button>
                </header>

                {error && (
                    <div className="admin-error" role="alert">
                        {error}
                    </div>
                )}

                <section className="admin-stats">
                    <div className="admin-stat-card">
                        <span>📄</span>
                        <p>Total Applications</p>
                        <h2>{loading ? "..." : totalApplications}</h2>
                    </div>

                    <div className="admin-stat-card">
                        <span>⏳</span>
                        <p>Pending</p>
                        <h2>{loading ? "..." : pendingCount}</h2>
                    </div>

                    <div className="admin-stat-card">
                        <span>✅</span>
                        <p>Approved</p>
                        <h2>{loading ? "..." : approvedCount}</h2>
                    </div>

                    <div className="admin-stat-card">
                        <span>❌</span>
                        <p>Rejected</p>
                        <h2>{loading ? "..." : rejectedCount}</h2>
                    </div>
                </section>

                <section className="admin-applications" id="applications">
                    <div className="admin-section-heading">
                        <div>
                            <h2>Scholarship Applications</h2>
                            <p>Review and update student applications.</p>
                        </div>

                        <select
                            className="admin-filter"
                            value={filter}
                            onChange={(event) => setFilter(event.target.value)}
                        >
                            <option value="all">All Applications</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Scholarship</th>
                                    <th>Amount</th>
                                    <th>Applied On</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="admin-empty">
                                            Loading applications...
                                        </td>
                                    </tr>
                                ) : filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="admin-empty">
                                            No applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplications.map((application) => {
                                        const status =
                                            application.status?.toLowerCase() ||
                                            "pending";

                                        return (
                                            <tr key={application._id}>
                                                <td>
                                                    <strong>
                                                        {application.student?.name ||
                                                            "Unknown student"}
                                                    </strong>
                                                    <small>
                                                        {application.student?.email ||
                                                            "No email"}
                                                    </small>
                                                </td>

                                                <td>
                                                    {application.scholarship?.name ||
                                                        "Scholarship unavailable"}
                                                </td>

                                                <td>
                                                    {application.scholarship?.amount != null
                                                        ? `₹${Number(
                                                              application.scholarship.amount
                                                          ).toLocaleString("en-IN")}`
                                                        : "—"}
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        application.createdAt
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`admin-status status-${status}`}
                                                    >
                                                        {status.charAt(0).toUpperCase() +
                                                            status.slice(1)}
                                                    </span>
                                                </td>

                                                <td>
                                                    {status === "pending" ? (
                                                        <div className="admin-actions">
                                                            <button
                                                                className="admin-approve"
                                                                disabled={
                                                                    updatingId ===
                                                                    application._id
                                                                }
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        application._id,
                                                                        "approved"
                                                                    )
                                                                }
                                                            >
                                                                Approve
                                                            </button>

                                                            <button
                                                                className="admin-reject"
                                                                disabled={
                                                                    updatingId ===
                                                                    application._id
                                                                }
                                                                onClick={() =>
                                                                    updateStatus(
                                                                        application._id,
                                                                        "rejected"
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="admin-no-action">
                                                            Reviewed
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AdminDashboard;
