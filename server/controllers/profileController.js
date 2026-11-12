
const User = require("../models/User");

// GET: Fetch the logged-in student's profile
exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "Profile fetched successfully",
            user,
        });
    } catch (error) {
        console.error("Get Profile Error:", error);

        return res.status(500).json({
            message: "Unable to fetch profile",
        });
    }
};

// PATCH: Update name and academic details
exports.updateMyProfile = async (req, res) => {
    try {
        const allowedFields = [
            "name",
            "college",
            "course",
            "branch",
            "yearOfStudy",
            "cgpa",
            "familyIncome",
        ];

        const updates = {};

        // Only accept explicitly allowed fields.
        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid profile fields provided",
            });
        }

        // Validate name.
        if (Object.prototype.hasOwnProperty.call(updates, "name")) {
            if (typeof updates.name !== "string") {
                return res.status(400).json({
                    message: "Name must be a string",
                });
            }

            updates.name = updates.name.trim();

            if (!updates.name) {
                return res.status(400).json({
                    message: "Name is required",
                });
            }

            if (updates.name.length > 100) {
                return res.status(400).json({
                    message: "Name must be 100 characters or fewer",
                });
            }
        }

        // Validate text-based academic fields.
        const textLimits = {
            college: 150,
            course: 100,
            branch: 100,
        };

        for (const [field, maxLength] of Object.entries(textLimits)) {
            if (Object.prototype.hasOwnProperty.call(updates, field)) {
                if (typeof updates[field] !== "string") {
                    return res.status(400).json({
                        message: `${field} must be a string`,
                    });
                }

                updates[field] = updates[field].trim();

                if (updates[field].length > maxLength) {
                    return res.status(400).json({
                        message: `${field} must be ${maxLength} characters or fewer`,
                    });
                }
            }
        }

        // Validate year of study: 1 to 6, or null/empty to clear it.
        if (Object.prototype.hasOwnProperty.call(updates, "yearOfStudy")) {
            const value = updates.yearOfStudy;

            if (value === "" || value === null) {
                updates.yearOfStudy = null;
            } else {
                const year = Number(value);

                if (
                    !Number.isInteger(year) ||
                    year < 1 ||
                    year > 6
                ) {
                    return res.status(400).json({
                        message: "Year of study must be an integer between 1 and 6",
                    });
                }

                updates.yearOfStudy = year;
            }
        }

        // Validate CGPA: 0 to 10, or null/empty to clear it.
        if (Object.prototype.hasOwnProperty.call(updates, "cgpa")) {
            const value = updates.cgpa;

            if (value === "" || value === null) {
                updates.cgpa = null;
            } else {
                const cgpa = Number(value);

                if (
                    !Number.isFinite(cgpa) ||
                    cgpa < 0 ||
                    cgpa > 10
                ) {
                    return res.status(400).json({
                        message: "CGPA must be between 0 and 10",
                    });
                }

                updates.cgpa = cgpa;
            }
        }

        // Validate annual family income
if (Object.prototype.hasOwnProperty.call(updates, "familyIncome")) {
    const value = updates.familyIncome;

    if (value === "" || value === null) {
        updates.familyIncome = null;
    } else {
        const income = Number(value);

        if (!Number.isFinite(income) || income < 0) {
            return res.status(400).json({
                message: "Family income must be a valid non-negative number",
            });
        }

        updates.familyIncome = income;
    }
}

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            message: "Unable to update profile",
        });
    }
};
