import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import ScholarshipAssistant from "../components/ScholarshipAssistant";


function StudentDashboard() {
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [scholarships, setScholarships] = useState([]);
    const [applications, setApplications] = useState([]);

    const [profileName, setProfileName] = useState("");
    const [profileEmail, setProfileEmail] = useState("");
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    
    const [college, setCollege] = useState("");
    const [course, setCourse] = useState("");
    const [branch, setBranch] = useState("");
    const [yearOfStudy, setYearOfStudy] = useState("");
    const [cgpa, setCgpa] = useState("");
    const [familyIncome, setFamilyIncome] = useState("");


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState("");

    // Check authentication and load the user saved at login.
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
    }, [navigate]);

    // Fetch dashboard data.
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            setLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError("");

                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                const [
                    scholarshipResponse,
                    applicationResponse,
                    notificationResponse,
                ] = await Promise.all([
                    fetch("/api/scholarships", { headers }),
                    fetch("/api/student/applications", { headers }),
                    fetch("/api/notifications", { headers }),
                ]);

                const scholarshipData = await scholarshipResponse.json();
                const applicationData = await applicationResponse.json();
                const notificationData = await notificationResponse.json();

                if (
                    scholarshipResponse.status === 401 ||
                    applicationResponse.status === 401
                ) {
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
                            ? `${previous} Unable to load applications.`
                            : "Unable to load applications."
                    );
                }

                if (notificationResponse.ok) {
                    setNotifications(
                        Array.isArray(notificationData.notifications)
                            ? notificationData.notifications
                            : []
                    );
                    setUnreadCount(Number(notificationData.unreadCount) || 0);
                    setNotificationError("");
                } else {
                    console.error(
                        "Notifications API error:",
                        notificationData.message
                    );
                    setNotificationError("Unable to load notifications.");
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("Unable to connect to the backend server.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    // Refresh notifications every 30 seconds.
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return undefined;

        const fetchNotifications = async () => {
            try {
                const response = await fetch("/api/notifications", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                setNotifications(
                    Array.isArray(data.notifications) ? data.notifications : []
                );
                setUnreadCount(Number(data.unreadCount) || 0);
                setNotificationError("");
            } catch (err) {
                console.error("Notification refresh error:", err);
            }
        };

        const intervalId = setInterval(fetchNotifications, 30000);
        return () => clearInterval(intervalId);
    }, []);

    // Fetch the logged-in student's profile.
    useEffect(() => {
        const fetchMyProfile = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setProfileLoading(false);
                navigate("/student-login", { replace: true });
                return;
            }

            try {
                setProfileLoading(true);
                setProfileError("");

                const response = await fetch("/api/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load profile.");
                }

                const user = data.user || {};
                setProfileName(user.name || "");
                setProfileEmail(user.email || "");
                
                setCollege(user.college || "");
                setCourse(user.course || "");
                setBranch(user.branch || "");
                setYearOfStudy(user.yearOfStudy ?? "");
                setCgpa(user.cgpa ?? "");
                setFamilyIncome(data.user.familyIncome ?? "");

                setStudent((previous) => ({ ...(previous || {}), ...user }));

                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        localStorage.setItem(
                            "user",
                            JSON.stringify({
                                ...parsedUser,
                                name: user.name,
                                email: user.email,
                            })
                        );
                    } catch (err) {
                        console.error("Unable to sync stored user:", err);
                    }
                }
            } catch (err) {
                console.error("Fetch profile error:", err);
                setProfileError(err.message || "Unable to load profile.");
            } finally {
                setProfileLoading(false);
            }
        };

        fetchMyProfile();
    }, [navigate]);

    const handleProfileSave = async (event) => {
        event.preventDefault();

        const token = localStorage.getItem("token");
        const trimmedName = profileName.trim();

        if (!token) {
            navigate("/student-login", { replace: true });
            return;
        }

        if (!trimmedName) {
            setProfileError("Name is required.");
            setProfileMessage("");
            return;
        }

        if (trimmedName.length > 100) {
            setProfileError("Name must be 100 characters or fewer.");
            setProfileMessage("");
            return;
        }

        try {
            setProfileSaving(true);
            setProfileError("");
            setProfileMessage("");

            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: trimmedName, college, course, branch, yearOfStudy: yearOfStudy === "" ? null : Number(yearOfStudy),
    cgpa: cgpa === "" ? null : Number(cgpa), familyIncome: familyIncome === "" ? null : Number(familyIncome) }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update profile.");
            }

            const user = data.user || {};
            setProfileName(user.name || trimmedName);
            setProfileEmail(user.email || profileEmail);
            
            setCollege(user.college || "");
            setCourse(user.course || "");
            setBranch(user.branch || "");
            setYearOfStudy(user.yearOfStudy ?? "");
            setCgpa(user.cgpa ?? "");
            setFamilyIncome(user.familyIncome ?? "");

            setStudent((previous) => ({ ...(previous || {}), ...user }));

            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    localStorage.setItem(
                        "user",
                        JSON.stringify({
                            ...JSON.parse(storedUser),
                            name: user.name || trimmedName,
                            email: user.email || profileEmail,
                        })
                    );
                } catch (err) {
                    console.error("Unable to sync stored user:", err);
                }
            }

            setProfileMessage("Profile updated successfully!");
        } catch (err) {
            console.error("Update profile error:", err);
            setProfileError(err.message || "Unable to update profile.");
        } finally {
            setProfileSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/student-login", { replace: true });
    };

    const handleMarkAsRead = async (notificationId) => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/student-login", { replace: true });
            return;
        }

        try {
            const response = await fetch(
                `/api/notifications/${notificationId}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setNotificationError(
                    data.message || "Unable to mark notification as read."
                );
                return;
            }

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification._id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
            setUnreadCount((previous) => Math.max(0, previous - 1));
            setNotificationError("");
        } catch (err) {
            console.error("Mark notification as read error:", err);
            setNotificationError("Unable to connect to the server.");
        }
    };
    const profileFields = [
        profileName,
        profileEmail,
        college,
        course,
        branch,
        yearOfStudy,
        cgpa,
        familyIncome,
    ];
    const completedProfileFields = profileFields.filter(
        (field) => String(field ?? "").trim() !== ""
    ).length;

    const profileCompletion = Math.round(
        (completedProfileFields / profileFields.length) * 100
    );

    
const evaluateScholarship = (scholarship) => {
    const criteria = scholarship.eligibilityCriteria;

    // Older scholarships may not have structured criteria.
    if (!criteria) {
        return {
            status: "needs-verification",
            reasons: ["Structured eligibility criteria are unavailable."]
        };
    }

    const checks = [];
    const reasons = [];

    const normalize = (value) =>
        String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

    // CGPA check
    if (criteria.minCGPA != null) {
        if (cgpa === "") {
            checks.push("missing");
            reasons.push("CGPA information is missing.");
        } else if (Number(cgpa) < criteria.minCGPA) {
            checks.push("failed");
            reasons.push(`Minimum CGPA required: ${criteria.minCGPA}.`);
        } else {
            checks.push("passed");
        }
    }

    // Course check
    if (criteria.eligibleCourses?.length > 0) {
        if (!course.trim()) {
            checks.push("missing");
            reasons.push("Course information is missing.");
        } else if (
            !criteria.eligibleCourses.some(
                (item) => normalize(item) === normalize(course)
            )
        ) {
            checks.push("failed");
            reasons.push("Your course does not match the eligible courses.");
        } else {
            checks.push("passed");
        }
    }

    // Branch check
    if (criteria.eligibleBranches?.length > 0) {
        if (!branch.trim()) {
            checks.push("missing");
            reasons.push("Branch information is missing.");
        } else if (
            !criteria.eligibleBranches.some((item) => {
    const eligibleBranch = normalize(item);
    const studentBranch = normalize(branch);

    return (
        eligibleBranch === studentBranch ||
        studentBranch.includes(eligibleBranch)
    );
})
        ) {
            checks.push("failed");
            reasons.push("Your branch does not match the eligible branches.");
        } else {
            checks.push("passed");
        }
    }

    // Year of study check
    if (criteria.eligibleYears?.length > 0) {
        if (yearOfStudy === "") {
            checks.push("missing");
            reasons.push("Year of study is missing.");
        } else if (
            !criteria.eligibleYears.includes(Number(yearOfStudy))
        ) {
            checks.push("failed");
            reasons.push("Your year of study is not eligible.");
        } else {
            checks.push("passed");
        }
    }

    // Family income check
if (criteria.maxFamilyIncome !== null && criteria.maxFamilyIncome !== undefined) {
    const familyIncome = student?.familyIncome;

    if (familyIncome === "" || familyIncome === null) {
        checks.push("missing");
        reasons.push("Family income needs verification.");
    } else if (Number(familyIncome) > criteria.maxFamilyIncome) {
        checks.push("failed");
        reasons.push(
            `Maximum family income allowed: ₹${criteria.maxFamilyIncome.toLocaleString("en-IN")}.`
        );
    } else {
        checks.push("passed");
    }
}


    if (checks.includes("failed")) {
        return { status: "not-eligible", reasons };
    }

    if (checks.includes("missing") || checks.length === 0) {
        return {
            status: "needs-verification",
            reasons: reasons.length
                ? reasons
                : ["No structured eligibility conditions are available."]
        };
    }

    return {
        status: "eligible",
        reasons: ["All specified eligibility criteria are satisfied."]
    };
};


    const scholarshipMatches = scholarships.map((scholarship) => ({
    ...scholarship,
    eligibilityResult: evaluateScholarship(scholarship),
}));

const eligibleScholarships = scholarshipMatches.filter(
    (item) => item.eligibilityResult.status === "eligible"
);

const verificationScholarships = scholarshipMatches.filter(
    (item) => item.eligibilityResult.status === "needs-verification"
);

const ineligibleScholarships = scholarshipMatches.filter(
    (item) => item.eligibilityResult.status === "not-eligible"
);


    const pendingApplications = applications.filter(
        (application) => application.status?.toLowerCase() === "pending"
    ).length;

    const approvedApplications = applications.filter(
        (application) => application.status?.toLowerCase() === "approved"
    ).length;

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

    const getDaysLeft = (deadline) => {
        if (!deadline) return "Deadline unavailable";

        const deadlineDate = new Date(deadline);
        if (Number.isNaN(deadlineDate.getTime())) {
            return "Deadline unavailable";
        }

        const difference = deadlineDate.getTime() - Date.now();
        if (difference <= 0) return "Deadline Passed";

        const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
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
                        onClick={(event) => {
                            event.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                    >
                        🏠 Dashboard
                    </a>

                    <a href="#scholarships">🎓 Scholarships</a>
                    <a href="#my-applications">📄 My Applications</a>
                    <a href="#profile">👤 Profile</a>
                    <a href="#ai-assistant">&#x1F916; AI Assistant</a>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Top Bar */}
                <header className="topbar">
                    <div>
                        <h1>Student Dashboard</h1>
                        <p>Welcome back to your ScholarAI account!</p>
                    </div>

                    <div className="notification-wrapper">
                        <button
                            type="button"
                            className="notification-bell"
                            aria-label={`Notifications, ${unreadCount} unread`}
                            aria-expanded={showNotifications}
                            onClick={() =>
                                setShowNotifications((previous) => !previous)
                            }
                        >
                            <span aria-hidden="true">🔔</span>
                            {unreadCount > 0 && (
                                <span className="notification-badge">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notification-panel">
                                <div className="notification-panel-header">
                                    <h3>Notifications</h3>
                                    <span>{unreadCount} unread</span>
                                </div>

                                {notificationError && (
                                    <p
                                        className="notification-error"
                                        role="alert"
                                    >
                                        {notificationError}
                                    </p>
                                )}

                                {notifications.length === 0 ? (
                                    <p className="notification-empty">
                                        You're all caught up!
                                    </p>
                                ) : (
                                    <div className="notification-list">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification._id}
                                                className={`notification-item ${
                                                    notification.isRead
                                                        ? "read"
                                                        : "unread"
                                                }`}
                                            >
                                                <div className="notification-item-content">
                                                    <strong>
                                                        {notification.title}
                                                    </strong>
                                                    <p>{notification.message}</p>
                                                    <small>
                                                        {notification.createdAt
                                                            ? new Date(
                                                                  notification.createdAt
                                                              ).toLocaleString(
                                                                  "en-IN"
                                                              )
                                                            : ""}
                                                    </small>
                                                </div>

                                                {!notification.isRead && (
                                                    <button
                                                        type="button"
                                                        className="notification-read-btn"
                                                        onClick={() =>
                                                            handleMarkAsRead(
                                                                notification._id
                                                            )
                                                        }
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="student-info">
                        <div className="avatar">
                            {student?.name
                                ? student.name.charAt(0).toUpperCase()
                                : "S"}
                        </div>
                        <div>
                            <strong>{student?.name || "Student"}</strong>
                            <span>Scholarship Applicant</span>
                        </div>
                    </div>
                </header>

                {/* API Error */}
                {error && (
                    <p
                        role="alert"
                        style={{ color: "#f87171", marginBottom: "20px" }}
                    >
                        {error}
                    </p>
                )}

                {/* Student Profile */}
                <section className="section profile-section" id="profile">
                    <div className="profile-completion">
    <div className="profile-completion-header">
        <h3>Profile Completion</h3>
        <strong>{profileCompletion}%</strong>
    </div>

    <div className="profile-progress-track">
        <div
            className="profile-progress-fill"
            style={{ width: `${profileCompletion}%` }}
        ></div>
    </div>

    <p>
        {profileCompletion === 100
            ? "Your profile is complete!"
            : "Complete your profile to improve your scholarship recommendations."}
    </p>
</div>
                    <div className="section-header">
                        <div>
                            <h2>My Profile</h2>
                            <p>View and update your personal information.</p>
                        </div>
                    </div>

                    {profileLoading ? (
                        <p>Loading profile...</p>
                    ) : (
                        <form
                            onSubmit={handleProfileSave}
                            className="profile-form"
                        >
                            <div className="profile-field">
                                <label htmlFor="profileName">Full Name</label>
                                <input
                                    id="profileName"
                                    type="text"
                                    value={profileName}
                                    onChange={(event) =>
                                        setProfileName(event.target.value)
                                    }
                                    maxLength={100}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            <div className="profile-field">
                                <label htmlFor="profileEmail">
                                    Email Address
                                </label>
                                <input
                                    id="profileEmail"
                                    type="email"
                                    value={profileEmail}
                                    readOnly
                                />
                                <small>Email cannot be changed here.</small>
                            </div>

                            
{/* Academic Details */}
<div className="academic-details-heading">
    <h3>Academic Details</h3>
    <p>Enter your current educational information.</p>
</div>

<div className="profile-field">
    <label htmlFor="college">College / University</label>
    <input
        id="college"
        type="text"
        value={college}
        onChange={(event) => setCollege(event.target.value)}
        maxLength={150}
        placeholder="Enter your college name"
    />
</div>

<div className="profile-field">
    <label htmlFor="course">Course</label>
    <input
        id="course"
        type="text"
        value={course}
        onChange={(event) => setCourse(event.target.value)}
        maxLength={100}
        placeholder="e.g. B.Tech"
    />
</div>

<div className="profile-field">
    <label htmlFor="branch">Branch / Specialization</label>
    <input
        id="branch"
        type="text"
        value={branch}
        onChange={(event) => setBranch(event.target.value)}
        maxLength={100}
        placeholder="e.g. Computer Science and Engineering (AI/ML)"
    />
</div>

<div className="profile-field">
    <label htmlFor="yearOfStudy">Year of Study</label>
    <select
        id="yearOfStudy"
        value={yearOfStudy}
        onChange={(event) => setYearOfStudy(event.target.value)}
    >
        <option value="">Select year</option>
        <option value="1">1st Year</option>
        <option value="2">2nd Year</option>
        <option value="3">3rd Year</option>
        <option value="4">4th Year</option>
        <option value="5">5th Year</option>
        <option value="6">6th Year</option>
    </select>
</div>

<div className="profile-field">
    <label htmlFor="cgpa">CGPA (out of 10)</label>
    <input
        id="cgpa"
        type="number"
        value={cgpa}
        onChange={(event) => setCgpa(event.target.value)}
        min="0"
        max="10"
        step="0.01"
        placeholder="e.g. 8.5"
    />
</div>


<div className="profile-field">
  <label htmlFor="familyIncome">Annual Family Income (₹)</label>
  <input
    id="familyIncome"
    type="number"
    min="0"
    placeholder="Enter annual family income"
    value={familyIncome}
    onChange={(e) => setFamilyIncome(e.target.value)}
  />
</div>


                            {profileError && (
                                <p className="profile-error" role="alert">
                                    {profileError}
                                </p>
                            )}

                            {profileMessage && (
                                <p className="profile-success" role="status">
                                    {profileMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="profile-save-btn"
                                disabled={profileSaving}
                            >
                                {profileSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </form>
                    )}
                </section>

                {/* Statistics */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">🎓</div>
                        <div>
                            <p>Available Scholarships</p>
                            <h2>{loading ? "..." : scholarships.length}</h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📄</div>
                        <div>
                            <p>Applications Submitted</p>
                            <h2>{loading ? "..." : applications.length}</h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">⏳</div>
                        <div>
                            <p>Pending Applications</p>
                            <h2>{loading ? "..." : pendingApplications}</h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div>
                            <p>Approved</p>
                            <h2>{loading ? "..." : approvedApplications}</h2>
                        </div>
                    </div>
                </section>

                {/* Scholarships */}
                <section className="section" id="scholarships">
                    <div className="section-header">
                        <div>
                            <h2>Available Scholarships</h2>
                            <p>Find scholarships you are eligible for.</p>
                        </div>

                        <button
                            type="button"
                            className="view-all"
                            onClick={() =>
                                document
                                    .getElementById("scholarships")
                                    ?.scrollIntoView({ behavior: "smooth" })
                            }
                        >
                            View All
                        </button>
                    </div>

                    <div className="matching-summary">
    <h3>Scholarship Eligibility Overview</h3>

    <div className="matching-stats">
        <div className="matching-stat eligible">
            <span>Eligible</span>
            <strong>{eligibleScholarships.length}</strong>
        </div>

        <div className="matching-stat verification">
            <span>Needs Verification</span>
            <strong>{verificationScholarships.length}</strong>
        </div>

        <div className="matching-stat ineligible">
            <span>Not Eligible</span>
            <strong>{ineligibleScholarships.length}</strong>
        </div>
    </div>
</div>

                    <div className="scholarship-grid">
                        {loading ? (
                            <p>Loading scholarships...</p>
                        ) : scholarships.length > 0 ? (
                            scholarshipMatches.map((scholarship) => (
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
                                            {getDaysLeft(scholarship.deadline)}
                                        </span>
                                    </div>

                                    <h3>{scholarship.name}</h3>
                                    <p>{scholarship.description}</p>

                                    <div className={`eligibility-status ${scholarship.eligibilityResult.status}`}>
    <strong>
        {scholarship.eligibilityResult.status === "eligible"
            ? "✓ Eligible"
            : scholarship.eligibilityResult.status === "not-eligible"
            ? "✕ Not Eligible"
            : "⚠ Needs Verification"}
    </strong>

    <ul>
        {scholarship.eligibilityResult.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
        ))}
    </ul>
</div>

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
                                        type="button"
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
                            <p>Track your scholarship applications.</p>
                        </div>
                    </div>

                    <div className="application-table">
                        <div className="table-header">
                            <span>Scholarship</span>
                            <span>Applied On</span>
                            <span>Status</span>
                            <span>Action</span>
                        </div>

                        {loading ? (
                            <div className="table-row">
                                <span>Loading applications...</span>
                                <span>—</span>
                                <span>—</span>
                                <span>—</span>
                            </div>
                        ) : applications.length > 0 ? (
                            applications.map((application) => (
                                <div
                                    className="table-row"
                                    key={application._id || application.id}
                                >
                                    <span>
                                        {application.scholarship?.name ||
                                            "Scholarship unavailable"}
                                    </span>
                                    <span>
                                        {formatDate(application.createdAt)}
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
                                    <span className="action">
                                        <button
                                            type="button"
                                            className="view-details-btn"
                                            onClick={() =>
                                                navigate(
                                                    `/student/application/${application._id}`
                                                )
                                            }
                                        >
                                            View Details
                                        </button>
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="table-row">
                                <span>No applications yet</span>
                                <span>—</span>
                                <span>—</span>
                                <span>—</span>
                            </div>
                        )}
                    </div>
                </section>
                            {/* AI Scholarship Assistant */}
                <section className="section" id="ai-assistant">
                    <div className="section-header">
                        <div>
                            <h2>AI Scholarship Assistant</h2>
                            <p>Ask anything about scholarships, eligibility and applications.</p>
                        </div>
                    </div>
                    <ScholarshipAssistant />
                </section>
            </main>
        </div>
    );
}

export default StudentDashboard;
