
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ScholarshipDetails.css";

function ScholarshipDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [scholarship, setScholarship] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [applying, setApplying] = useState(false);
    const [applicationMessage, setApplicationMessage] = useState("");
    const [applicationError, setApplicationError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/student-login";
            return;
        }

        const fetchScholarship = async () => {
            try {
                const response = await fetch(
                    `/api/scholarships/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setScholarship(data.scholarship || data);
                } else {
                    setError(
                        data.message || "Failed to fetch scholarship"
                    );
                }
            } catch (err) {
                console.error("Scholarship details error:", err);
                setError("Unable to connect to server");
            } finally {
                setLoading(false);
            }
        };

        fetchScholarship();
    }, [id]);

    const handleApply = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "/student-login";
            return;
        }

        setApplying(true);
        setApplicationMessage("");
        setApplicationError("");

        try {
            const response = await fetch(
                "/api/student/apply",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        scholarshipId: id,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setApplicationMessage(
                    data.message || "Application submitted successfully!"
                );
            } else {
                setApplicationError(
                    data.message || "Failed to submit application"
                );
            }
        } catch (err) {
            console.error("Application submission error:", err);
            setApplicationError(
                "Unable to connect to server. Please try again."
            );
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="scholarship-details-page">
                <h2>Loading scholarship...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="scholarship-details-page">
                <button
                    className="back-btn"
                    onClick={() => navigate("/student-dashboard")}
                >
                    ← Back to Dashboard
                </button>

                <div className="error-message">{error}</div>
            </div>
        );
    }

    if (!scholarship) {
        return (
            <div className="scholarship-details-page">
                <h2>Scholarship not found.</h2>
            </div>
        );
    }

    const deadlineDate = new Date(scholarship.deadline);
    const difference = deadlineDate.getTime() - Date.now();

    const daysLeft = Math.max(
        0,
        Math.ceil(difference / (1000 * 60 * 60 * 24))
    );

    return (
        <div className="scholarship-details-page">
            <button
                className="back-btn"
                onClick={() => navigate("/student-dashboard")}
            >
                ← Back to Dashboard
            </button>

            <div className="details-card">
                <div className="details-header">
                    <div>
                        <span className="details-tag">
                            {scholarship.category || "Scholarship"}
                        </span>

                        <h1>{scholarship.name}</h1>

                        <p className="provider">
                            Provided by{" "}
                            <strong>{scholarship.provider}</strong>
                        </p>
                    </div>

                    <div className="days-left">
                        {daysLeft} Days Left
                    </div>
                </div>

                <div className="details-section">
                    <h2>About the Scholarship</h2>
                    <p>{scholarship.description}</p>
                </div>

                <div className="details-grid">
                    <div className="detail-box">
                        <span className="detail-icon">💰</span>
                        <div>
                            <p>Scholarship Amount</p>
                            <h3>
                                ₹
                                {Number(scholarship.amount).toLocaleString(
                                    "en-IN"
                                )}
                            </h3>
                        </div>
                    </div>

                    <div className="detail-box">
                        <span className="detail-icon">📅</span>
                        <div>
                            <p>Application Deadline</p>
                            <h3>
                                {deadlineDate.toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </h3>
                        </div>
                    </div>

                    <div className="detail-box">
                        <span className="detail-icon">✅</span>
                        <div>
                            <p>Status</p>
                            <h3>{scholarship.status || "Active"}</h3>
                        </div>
                    </div>

                    <div className="detail-box">
                        <span className="detail-icon">🎓</span>
                        <div>
                            <p>Target Students</p>
                            <h3>{scholarship.target || "UG Students"}</h3>
                        </div>
                    </div>
                </div>

                <div className="details-section">
                    <h2>Eligibility</h2>
                    <p>{scholarship.eligibility}</p>
                </div>

                <div className="details-actions">
                    {applicationMessage && (
                        <p role="status" style={{ color: "#22c55e" }}>
                            {applicationMessage}
                        </p>
                    )}

                    {applicationError && (
                        <p role="alert" style={{ color: "#f87171" }}>
                            {applicationError}
                        </p>
                    )}

                    <button
                        className="apply-now-btn"
                        onClick={handleApply}
                        disabled={applying || Boolean(applicationMessage)}
                    >
                        {applying
                            ? "Submitting..."
                            : applicationMessage
                            ? "Application Submitted"
                            : "Apply Now"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ScholarshipDetails;
