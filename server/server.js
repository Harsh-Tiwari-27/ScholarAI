const dotenv = require("dotenv");
dotenv.config(); // MUST be first — loads JWT_SECRET, MONGO_URI, PORT before any module reads them

const express = require("express");
const cors = require("cors");

// Database
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const scholarshipRoutes = require("./routes/scholarshipRoutes");
const studentRoutes = require("./routes/studentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Connect MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Test route
app.get("/", (req, res) => {
    res.json({
        message: "ScholarAI API is running successfully"
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);

// 404 Route
app.use((req, res) => {
    res.status(404).json({
        message: "API Route Not Found",
        path: req.originalUrl
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Server Error:", err);

    res.status(500).json({
        message: "Internal Server Error",
        error: err.message
    });
});

// Server Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`ScholarAI server running on port ${PORT}`);
});