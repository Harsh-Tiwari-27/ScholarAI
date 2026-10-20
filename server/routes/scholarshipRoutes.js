const express = require("express");

const router = express.Router();

const {
    createScholarship,
    getScholarships,
    getScholarshipById
} = require("../controllers/scholarshipController");

const authMiddleware = require("../middleware/authMiddleware");

// GET all scholarships
router.get(
    "/",
    authMiddleware,
    getScholarships
);

// GET single scholarship
router.get(
    "/:id",
    authMiddleware,
    getScholarshipById
);

// POST new scholarship
router.post(
    "/",
    authMiddleware,
    createScholarship
);

module.exports = router;