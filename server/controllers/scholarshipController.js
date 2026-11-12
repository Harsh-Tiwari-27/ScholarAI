const Scholarship = require("../models/Scholarship");

// ==========================================
// Create Scholarship
// ==========================================
exports.createScholarship = async (req, res) => {
    try {
        const {
            name,
            description,
            provider,
            amount,
            eligibility,
            eligibilityCriteria,
            deadline,
            status
        } = req.body;

        // Validate required fields
        if (
            !name ||
            !description ||
            !provider ||
            !amount ||
            !eligibility ||
            !deadline
        ) {
            return res.status(400).json({
                message: "All required fields must be provided"
            });
        }

        // Create scholarship
        const scholarship = await Scholarship.create({
            name,
            description,
            provider,
            amount,
            eligibility,
            eligibilityCriteria:{
                minCGPA: eligibilityCriteria?.minCGPA ?? null,
                maxFamilyIncome: eligibilityCriteria?.maxFamilyIncome ?? null,
                eligibleCourses: eligibilityCriteria?.eligibleCourses || [],
                eligibleBranches: eligibilityCriteria?.eligibleBranches || [],
                eligibleYears: eligibilityCriteria?.eligibleYears || []
            },
            deadline,
            status: status || "active"
        });

        res.status(201).json({
            message: "Scholarship created successfully",
            scholarship
        });

    } catch (error) {
        console.error(
            "Create scholarship error:",
            error
        );

        res.status(500).json({
            message: "Failed to create scholarship",
            error: error.message
        });
    }
};


// ==========================================
// Get All Scholarships
// ==========================================
exports.getScholarships = async (req, res) => {
    try {
        const scholarships = await Scholarship.find({
            status: "active"
        }).sort({
            deadline: 1
        });

        res.status(200).json({
            message: "Scholarships fetched successfully",
            count: scholarships.length,
            scholarships
        });

    } catch (error) {
        console.error(
            "Get scholarships error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch scholarships",
            error: error.message
        });
    }
};


// ==========================================
// Get Scholarship By ID
// ==========================================
exports.getScholarshipById = async (req, res) => {
    try {
        const { id } = req.params;

        const scholarship =
            await Scholarship.findById(id);

        if (!scholarship) {
            return res.status(404).json({
                message: "Scholarship not found"
            });
        }

        res.status(200).json(scholarship);

    } catch (error) {
        console.error(
            "Get scholarship by ID error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch scholarship",
            error: error.message
        });
    }
};