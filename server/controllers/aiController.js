
"use strict";

const User        = require("../models/User");
const Scholarship = require("../models/Scholarship");

const { generateScholarshipAnswer } = require("../services/geminiService");
const { evaluateEligibility }       = require("../utils/evaluateEligibility");

// POST /api/ai/ask  — Ask the AI Scholarship Assistant
exports.askScholarshipAssistant = async (req, res) => {
  try {
    const { question, chatHistory = [] } = req.body;

    // ── Input validation ───────────────────────────────────────────────────
    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "Please enter a valid question." });
    }

    if (question.length > 2000) {
      return res.status(400).json({ message: "Question must be 2000 characters or fewer." });
    }

    if (!Array.isArray(chatHistory) || chatHistory.length > 10) {
      return res.status(400).json({ message: "Invalid chat history." });
    }

    // ── Fetch authenticated student profile ────────────────────────────────
    const student = await User.findById(req.user.id)
      .select("-password -__v")
      .lean();

    if (!student) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    // ── Fetch active scholarships ──────────────────────────────────────────
    const scholarships = await Scholarship.find({ status: "active" })
      .select("name description provider amount eligibility eligibilityCriteria deadline status")
      .lean();

    // ── Build clean student context ────────────────────────────────────────
    const studentContext = {
      name:         student.name,
      college:      student.college      || null,
      course:       student.course       || null,
      branch:       student.branch       || null,
      yearOfStudy:  student.yearOfStudy  ?? null,
      cgpa:         student.cgpa         ?? null,
      familyIncome: student.familyIncome ?? null,
    };

    // ── Identify missing profile fields ────────────────────────────────────
    const missingFields = [];
    if (!studentContext.college)                 missingFields.push("college");
    if (!studentContext.course)                  missingFields.push("course");
    if (!studentContext.branch)                  missingFields.push("branch");
    if (studentContext.yearOfStudy  === null)    missingFields.push("year of study");
    if (studentContext.cgpa         === null)    missingFields.push("CGPA");
    if (studentContext.familyIncome === null)    missingFields.push("annual family income");

    // ── Run deterministic eligibility engine for every scholarship ─────────
    //
    //  evaluateEligibility() returns:
    //    { status, reasons, criteriaDetail }
    //
    //  criteriaDetail is a per-criterion breakdown:
    //    [{ criterion, outcome, required, studentValue, note }, ...]
    //
    //  Gemini receives ALL of this.  It must explain the pre-computed results
    //  without changing any eligibility status.
    //
    const scholarshipContext = scholarships.map((scholarship) => {
      const { status, reasons, criteriaDetail } =
        evaluateEligibility(studentContext, scholarship);

      return {
        // Core scholarship info
        name:        scholarship.name,
        description: scholarship.description,
        provider:    scholarship.provider,
        amount:      scholarship.amount,
        deadline:    scholarship.deadline,

        // Human-readable eligibility description from the DB record
        eligibilityDescription: scholarship.eligibility || null,

        // ── Pre-computed eligibility result (Gemini must NOT override this) ──
        eligibilityResult: {
          // Overall verdict from the deterministic engine
          status,         // "eligible" | "not-eligible" | "needs-verification"

          // Narrative per-criterion reasons (unchanged from previous version)
          reasons,

          // NEW: Structured per-criterion breakdown for Gemini
          //   Each entry tells Gemini exactly:
          //     - which criterion was checked
          //     - whether the student passed, failed, or has data missing
          //     - the value the scholarship requires
          //     - the student's actual value
          //     - a plain-English note about the outcome
          criteriaDetail,
        },
      };
    });

    // ── Generate AI response ───────────────────────────────────────────────
    const answer = await generateScholarshipAnswer({
      question:          question.trim(),
      studentContext,
      missingFields,
      scholarshipContext,
      chatHistory:       chatHistory.slice(-10),
    });

    return res.status(200).json({
      message: "AI response generated successfully.",
      answer,
    });

  } catch (error) {
    console.error("AI Scholarship Assistant Error:", error);
    return res.status(500).json({
      message: "Unable to generate an AI response. Please try again.",
    });
  }
};
