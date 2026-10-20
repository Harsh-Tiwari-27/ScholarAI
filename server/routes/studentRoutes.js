const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const { getDashboard } = require("../controllers/studentController");

const {
    applyScholarship,
    getMyApplications,
    getApplicationById
} = require("../controllers/applicationController");


// ===============================
// Student Dashboard
// ===============================

router.get(
    "/dashboard",
    authMiddleware,
    getDashboard
);


// ===============================
// Scholarship Application
// ===============================

// Apply for a scholarship
router.post(
    "/apply",
    authMiddleware,
    applyScholarship
);


// Get logged-in student's applications
router.get(
    "/applications",
    authMiddleware,
    getMyApplications
);


// Get single application
router.get(
    "/applications/:id",
    authMiddleware,
    getApplicationById
);


module.exports = router;