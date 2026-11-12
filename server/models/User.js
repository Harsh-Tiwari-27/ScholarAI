// TODO: Mongoose User schema/model will be defined here

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    
role: {
    type: String,
    enum: ["student", "admin"],
    default: "student",
},

// Academic Details
college: {
    type: String,
    trim: true,
    default: "",
    maxlength: 150,
},

course: {
    type: String,
    trim: true,
    default: "",
    maxlength: 100,
},

branch: {
    type: String,
    trim: true,
    default: "",
    maxlength: 100,
},

yearOfStudy: {
    type: Number,
    min: 1,
    max: 6,
    default: null,
},

cgpa: {
    type: Number,
    min: 0,
    max: 10,
    default: null,
},

familyIncome: {
    type: Number,
    min: 0,
    default: null,
},

  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
