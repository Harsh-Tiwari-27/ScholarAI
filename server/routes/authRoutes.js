// TODO: Express auth routes will be defined here
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

router.get("/profile", authMiddleware, (req, res) => {
    res.status(200).json({
        message: "User profile fetched successfully",
        user: req.user
    });
});


const {
    register,
    login
} = require("../controllers/authController");

// Register API
router.post("/register", register);

// Login API
router.post("/login", login);

module.exports = router;