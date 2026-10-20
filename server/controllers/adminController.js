const Application = require("../models/Application");

// Get all applications
exports.getAllApplications = async (req, res) => {
    try {
        const applications = await Application.find()
            .populate("student", "name email role")
            .populate("scholarship", "name provider amount")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Applications fetched successfully",
            count: applications.length,
            applications
        });

    } catch (error) {
        console.error("Get All Applications Error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Get single application
exports.getApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate("student", "name email role")
            .populate("scholarship", "name provider amount");

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        res.status(200).json({
            message: "Application fetched successfully",
            application
        });

    } catch (error) {
        console.error("Get Application Error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Approve application
exports.approveApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (application.status === "approved") {
            return res.status(400).json({
                message: "Application is already approved"
            });
        }

        application.status = "approved";

        await application.save();

        res.status(200).json({
            message: "Application approved successfully",
            application
        });

    } catch (error) {
        console.error("Approve Application Error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Reject application
exports.rejectApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (application.status === "rejected") {
            return res.status(400).json({
                message: "Application is already rejected"
            });
        }

        application.status = "rejected";

        await application.save();

        res.status(200).json({
            message: "Application rejected successfully",
            application
        });

    } catch (error) {
        console.error("Reject Application Error:", error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};