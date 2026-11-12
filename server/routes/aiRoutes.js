
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  askScholarshipAssistant,
} = require("../controllers/aiController");

// Protected AI assistant endpoint
router.post(
  "/ask",
  authMiddleware,
  askScholarshipAssistant
);

module.exports = router;
