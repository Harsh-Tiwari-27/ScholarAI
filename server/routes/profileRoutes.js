
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getMyProfile,
    updateMyProfile
} = require("../controllers/profileController");

router.get("/", authMiddleware, getMyProfile);
router.patch("/", authMiddleware, updateMyProfile);

module.exports = router;
