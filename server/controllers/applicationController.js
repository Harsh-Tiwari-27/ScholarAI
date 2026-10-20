
const Application = require("../models/Application");
const Scholarship = require("../models/Scholarship");

// Apply for a scholarship
const applyScholarship = async (req, res) => {
    try {
        const { scholarshipId } = req.body;
        const studentId = req.user.id;

        if (!scholarshipId) {
            return res.status(400).json({
                message: "Scholarship ID is required"
            });
        }

        const scholarship = await Scholarship.findById(
            scholarshipId
        );

        if (!scholarship) {
            return res.status(404).json({
                message: "Scholarship not found"
            });
        }

        if (scholarship.status !== "active") {
            return res.status(400).json({
                message: "This scholarship is not active"
            });
        }

        const existingApplication = await Application.findOne({
            student: studentId,
            scholarship: scholarshipId
        });

        if (existingApplication) {
            return res.status(409).json({
                message: "You have already applied for this scholarship"
            });
        }

        const application = await Application.create({
            student: studentId,
            scholarship: scholarshipId,
            status: "pending"
        });

        return res.status(201).json({
            message: "Scholarship application submitted successfully",
            application
        });

    } catch (error) {
        console.error("Apply Scholarship Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid scholarship ID"
            });
        }

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Get student's applications
const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            student: req.user.id
        })
            .populate("scholarship")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Applications fetched successfully",
            count: applications.length,
            applications
        });

    } catch (error) {
        console.error("Get Applications Error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Get single application
const getApplicationById = async (req, res) => {
    try {
        const application = await Application.findOne({
            _id: req.params.id,
            student: req.user.id
        }).populate("scholarship");

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        return res.status(200).json({
            message: "Application fetched successfully",
            application
        });

    } catch (error) {
        console.error("Get Application Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid application ID"
            });
        }

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Update application status (Admin)
const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        application.status = status;
        await application.save();

        return res.status(200).json({
            message: "Application status updated successfully",
            application
        });

    } catch (error) {
        console.error("Update Application Status Error:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    applyScholarship,
    getMyApplications,
    getApplicationById,
    updateApplicationStatus
};
