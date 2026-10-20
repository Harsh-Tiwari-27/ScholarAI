const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const resetAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const newPassword = "Admin@123";

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const user = await User.findOneAndUpdate(
            { email: "admin@scholarai.com" },
            {
                password: hashedPassword,
                role: "admin"
            },
            { new: true }
        );

        if (!user) {
            console.log("Admin user not found");
            process.exit(1);
        }

        console.log("Admin password reset successfully");
        console.log("Email:", user.email);
        console.log("Password:", newPassword);
        console.log("Role:", user.role);

        process.exit(0);

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

resetAdminPassword();