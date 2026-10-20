const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    getAllApplications,
    getApplicationById,
    approveApplication,
    rejectApplication
} = require("../controllers/adminController");

// All admin routes require:
// 1. Valid JWT
// 2. Admin role

// Test admin route
router.get(
    "/test",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
        res.status(200).json({
            message: "Admin route working successfully",
            user: req.user
        });
    }
);

router.get(
    "/applications",
    authMiddleware,
    adminMiddleware,
    getAllApplications
);

router.get(
    "/applications/:id",
    authMiddleware,
    adminMiddleware,
    getApplicationById
);

router.put(
    "/applications/:id/approve",
    authMiddleware,
    adminMiddleware,
    approveApplication
);

router.put(
    "/applications/:id/reject",
    authMiddleware,
    adminMiddleware,
    rejectApplication
);

module.exports = router;