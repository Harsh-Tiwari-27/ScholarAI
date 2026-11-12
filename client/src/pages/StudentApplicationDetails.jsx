
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./StudentApplicationDetails.css";

function StudentApplicationDetails() {
  const { id } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplication = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/student-login";
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/student/applications/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/student-login";
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load application details."
          );
        }

        setApplication(data.application || data);
      } catch (err) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

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

  if (loading) {
    return (
      <main className="application-details-page">
        <p>Loading application details...</p>
      </main>
    );
  }

  if (error || !application) {
    return (
      <main className="application-details-page">
        <h1>Application Details</h1>
        <p className="application-details-error">
          {error || "Application not found."}
        </p>
        <Link to="/student-dashboard">Back to Dashboard</Link>
      </main>
    );
  }

  const scholarship = application.scholarship || {};
  const status = (application.status || "pending").toLowerCase();

  const statusMessage = {
    pending: "Your application is awaiting review.",
    approved: "Your application has been approved.",
    rejected: "Your application has been rejected.",
  };

  return (
    <main className="application-details-page">
      <div className="application-details-container">
        <Link
          to="/student-dashboard"
          className="application-details-back"
        >
          ← Back to Dashboard
        </Link>

        <header className="application-details-header">
          <div>
            <p className="application-details-eyebrow">
              SCHOLARAI · STUDENT PORTAL
            </p>
            <h1>Application Details</h1>
            <p>View your scholarship application and its current status.</p>
          </div>

          <span className={`application-details-status status-${status}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </header>

        <section className="application-details-card">
          <h2>Scholarship Information</h2>

          <div className="application-details-grid">
            <div>
              <span>Scholarship Name</span>
              <strong>{scholarship.name || "Scholarship unavailable"}</strong>
            </div>

            <div>
              <span>Provider</span>
              <strong>{scholarship.provider || "—"}</strong>
            </div>

            <div>
              <span>Amount</span>
              <strong>
                {scholarship.amount != null
                  ? `₹${Number(scholarship.amount).toLocaleString("en-IN")}`
                  : "—"}
              </strong>
            </div>

            <div>
              <span>Application Date</span>
              <strong>{formatDate(application.createdAt)}</strong>
            </div>

            <div>
              <span>Application ID</span>
              <strong className="application-details-id">
                {application._id || application.id || "—"}
              </strong>
            </div>

            <div>
              <span>Scholarship Deadline</span>
              <strong>{formatDate(scholarship.deadline)}</strong>
            </div>
          </div>
        </section>

        <section className="application-details-card">
          <h2>Application Status</h2>
          <div className={`application-details-status-panel status-${status}`}>
            <strong>
              {statusMessage[status] || `Current status: ${status}`}
            </strong>
          </div>
        </section>
        
        {/* Application Progress Timeline */}
        <section className="application-details-card">
          <h2>Application Progress</h2>

          <div className="application-timeline">
            <div className="timeline-item completed">
              <div className="timeline-marker">✓</div>
              <div className="timeline-content">
                <strong>Application Submitted</strong>
                <p>
                  Submitted on {formatDate(application.createdAt)}
                </p>
              </div>
            </div>

            <div
              className={`timeline-item ${
                status === "pending" ? "active" : "completed"
              }`}
            >
              <div className="timeline-marker">
                {status === "pending" ? "2" : "✓"}
              </div>
              <div className="timeline-content">
                <strong>Under Review</strong>
                <p>
                  {status === "pending"
                    ? "Your application is awaiting review."
                    : "The review process is complete."}
                </p>
              </div>
            </div>

            
            <div
  className={`timeline-item ${
    status === "approved"
      ? "completed"
      : status === "rejected"
      ? "rejected"
      : "upcoming"
  }`}
>
  <div className="timeline-marker">
    {status === "approved"
      ? "✓"
      : status === "rejected"
      ? "×"
      : "3"}
  </div>

  <div className="timeline-content">
    <strong>
      {status === "approved"
        ? "Application Approved"
        : status === "rejected"
        ? "Application Rejected"
        : "Final Decision"}
    </strong>

    <p>
      {status === "approved"
        ? "Congratulations! Your application has been approved."
        : status === "rejected"
        ? "Your application was not approved."
        : "The final decision is pending."}
    </p>
  </div>
</div>

          </div>
        </section>


        <section className="application-details-card">
          <h2>Description</h2>
          <p>
            {scholarship.description || "No description available."}
          </p>

          <h3>Eligibility</h3>
          <p>
            {scholarship.eligibility ||
              "Eligibility information is unavailable."}
          </p>
        </section>
      </div>
    </main>
  );
}

export default StudentApplicationDetails;
