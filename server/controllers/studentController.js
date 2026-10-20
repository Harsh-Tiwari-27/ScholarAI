const User = require("../models/User");
const Scholarship = require("../models/scholarship");
const Application = require("../models/Application");

// Student Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const student = await User.findById(req.user.id)
            .select("-password");

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const applications = await Application.find({
            student: req.user.id
        }).populate("scholarship");

        const scholarships = await Scholarship.find({
            status: "active"
        });

        res.status(200).json({
            message: "Student dashboard fetched successfully",

            student,

            scholarships,

            applications,

            statistics: {
                totalApplications: applications.length,

                pending: applications.filter(
                    app => app.status === "pending"
                ).length,

                approved: applications.filter(
                    app => app.status === "approved"
                ).length,

                rejected: applications.filter(
                    app => app.status === "rejected"
                ).length
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard",
            error: error.message
        });
    }
};