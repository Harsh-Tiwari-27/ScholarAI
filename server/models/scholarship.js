const mongoose = require("mongoose");

const scholarshipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    provider: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    eligibility: {
      type: String,
      required: true
    },

    deadline: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Scholarship ||
  mongoose.model("Scholarship", scholarshipSchema);