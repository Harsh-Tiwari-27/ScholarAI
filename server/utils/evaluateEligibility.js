/**
 * evaluateEligibility.js
 *
 * Deterministic, server-side scholarship eligibility engine.
 *
 * This is the authoritative source of truth used by the AI controller to
 * pre-compute eligibility before sending context to Gemini.  The logic is
 * intentionally kept identical to the evaluateScholarship() function in
 * StudentDashboard.jsx so that the AI always explains the same result that
 * the student sees on screen.
 *
 * Returns: { status, reasons, criteriaDetail }
 *   status         — "eligible" | "needs-verification" | "not-eligible"
 *   reasons        — string[]  describing which criteria passed, failed or are
 *                    missing (unchanged — used by the UI eligibility widget)
 *   criteriaDetail — object[]  structured per-criterion breakdown used by
 *                    geminiService to build a precise, grounded AI prompt
 *
 * NOTE: The eligibility rules (checks[], final status resolution) are identical
 * to the previous version.  All 18 unit tests continue to pass against the
 * exported evaluateEligibility function.
 */

"use strict";

/**
 * Normalise a value for case- and punctuation-insensitive string comparison.
 * Mirrors the normalize() helper in StudentDashboard.jsx exactly.
 *
 * @param {*} value
 * @returns {string}
 */
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Evaluate whether a student meets a scholarship's eligibility criteria.
 *
 * @param {object} student     - Lean User document fields
 *   { cgpa, course, branch, yearOfStudy, familyIncome }
 * @param {object} scholarship - Lean Scholarship document
 *   { name, eligibilityCriteria }
 *
 * @returns {{
 *   status:         string,
 *   reasons:        string[],
 *   criteriaDetail: Array<{
 *     criterion:     string,
 *     outcome:       "passed"|"failed"|"missing",
 *     required:      string,
 *     studentValue:  string,
 *     note:          string
 *   }>
 * }}
 */
function evaluateEligibility(student, scholarship) {
  const criteria = scholarship.eligibilityCriteria;

  // Older records without structured criteria → needs verification
  if (!criteria) {
    return {
      status: "needs-verification",
      reasons: ["Structured eligibility criteria are unavailable for this scholarship."],
      criteriaDetail: [
        {
          criterion:    "Structured Criteria",
          outcome:      "missing",
          required:     "N/A",
          studentValue: "N/A",
          note:         "No structured eligibility criteria are recorded for this scholarship.",
        },
      ],
    };
  }

  const checks        = []; // "passed" | "failed" | "missing"
  const reasons       = []; // narrative strings (unchanged — used by UI widget)
  const criteriaDetail = []; // structured breakdown (new — used by Gemini prompt)

  // ── CGPA ──────────────────────────────────────────────────────────────────
  if (criteria.minCGPA != null) {
    const studentCgpa = student.cgpa;

    if (studentCgpa === null || studentCgpa === undefined || studentCgpa === "") {
      checks.push("missing");
      reasons.push("Your CGPA is not set in your profile.");
      criteriaDetail.push({
        criterion:    "Minimum CGPA",
        outcome:      "missing",
        required:     String(criteria.minCGPA),
        studentValue: "Not set",
        note:         "Add your CGPA to your profile so this criterion can be evaluated.",
      });
    } else if (Number(studentCgpa) < criteria.minCGPA) {
      checks.push("failed");
      reasons.push(
        `Minimum CGPA required is ${criteria.minCGPA}. Your CGPA is ${studentCgpa}.`
      );
      criteriaDetail.push({
        criterion:    "Minimum CGPA",
        outcome:      "failed",
        required:     String(criteria.minCGPA),
        studentValue: String(studentCgpa),
        note:         `Your CGPA (${studentCgpa}) is below the required minimum (${criteria.minCGPA}). You need ${(criteria.minCGPA - Number(studentCgpa)).toFixed(2)} more points.`,
      });
    } else {
      checks.push("passed");
      reasons.push(
        `CGPA requirement met (required ≥ ${criteria.minCGPA}, yours is ${studentCgpa}).`
      );
      criteriaDetail.push({
        criterion:    "Minimum CGPA",
        outcome:      "passed",
        required:     `≥ ${criteria.minCGPA}`,
        studentValue: String(studentCgpa),
        note:         `Your CGPA (${studentCgpa}) meets or exceeds the requirement.`,
      });
    }
  }

  // ── Course ─────────────────────────────────────────────────────────────────
  if (criteria.eligibleCourses && criteria.eligibleCourses.length > 0) {
    const studentCourse = student.course || "";
    const courseList    = criteria.eligibleCourses.join(", ");

    if (!studentCourse.trim()) {
      checks.push("missing");
      reasons.push("Your course is not set in your profile.");
      criteriaDetail.push({
        criterion:    "Eligible Course",
        outcome:      "missing",
        required:     courseList,
        studentValue: "Not set",
        note:         "Add your course to your profile so this criterion can be evaluated.",
      });
    } else if (
      !criteria.eligibleCourses.some(
        (item) => normalize(item) === normalize(studentCourse)
      )
    ) {
      checks.push("failed");
      reasons.push(
        `Your course "${studentCourse}" is not in the eligible courses: ${courseList}.`
      );
      criteriaDetail.push({
        criterion:    "Eligible Course",
        outcome:      "failed",
        required:     courseList,
        studentValue: studentCourse,
        note:         `"${studentCourse}" does not match any of the eligible courses.`,
      });
    } else {
      checks.push("passed");
      reasons.push(`Course "${studentCourse}" is eligible.`);
      criteriaDetail.push({
        criterion:    "Eligible Course",
        outcome:      "passed",
        required:     courseList,
        studentValue: studentCourse,
        note:         `"${studentCourse}" is in the list of eligible courses.`,
      });
    }
  }

  // ── Branch ─────────────────────────────────────────────────────────────────
  if (criteria.eligibleBranches && criteria.eligibleBranches.length > 0) {
    const studentBranch = student.branch || "";
    const branchList    = criteria.eligibleBranches.join(", ");

    if (!studentBranch.trim()) {
      checks.push("missing");
      reasons.push("Your branch is not set in your profile.");
      criteriaDetail.push({
        criterion:    "Eligible Branch",
        outcome:      "missing",
        required:     branchList,
        studentValue: "Not set",
        note:         "Add your branch to your profile so this criterion can be evaluated.",
      });
    } else if (
      !criteria.eligibleBranches.some((item) => {
        const eligibleBranch = normalize(item);
        const sBranch        = normalize(studentBranch);
        return eligibleBranch === sBranch || sBranch.includes(eligibleBranch);
      })
    ) {
      checks.push("failed");
      reasons.push(
        `Your branch "${studentBranch}" is not in the eligible branches: ${branchList}.`
      );
      criteriaDetail.push({
        criterion:    "Eligible Branch",
        outcome:      "failed",
        required:     branchList,
        studentValue: studentBranch,
        note:         `"${studentBranch}" does not match any of the eligible branches.`,
      });
    } else {
      checks.push("passed");
      reasons.push(`Branch "${studentBranch}" is eligible.`);
      criteriaDetail.push({
        criterion:    "Eligible Branch",
        outcome:      "passed",
        required:     branchList,
        studentValue: studentBranch,
        note:         `"${studentBranch}" matches an eligible branch.`,
      });
    }
  }

  // ── Year of Study ──────────────────────────────────────────────────────────
  if (criteria.eligibleYears && criteria.eligibleYears.length > 0) {
    const studentYear = student.yearOfStudy;
    const yearList    = criteria.eligibleYears.join(", ");

    if (studentYear === null || studentYear === undefined || studentYear === "") {
      checks.push("missing");
      reasons.push("Your year of study is not set in your profile.");
      criteriaDetail.push({
        criterion:    "Year of Study",
        outcome:      "missing",
        required:     yearList,
        studentValue: "Not set",
        note:         "Add your year of study to your profile so this criterion can be evaluated.",
      });
    } else if (!criteria.eligibleYears.includes(Number(studentYear))) {
      checks.push("failed");
      reasons.push(
        `Your year of study (Year ${studentYear}) is not in the eligible years: ${yearList}.`
      );
      criteriaDetail.push({
        criterion:    "Year of Study",
        outcome:      "failed",
        required:     `Year ${yearList}`,
        studentValue: `Year ${studentYear}`,
        note:         `Year ${studentYear} is not among the eligible years (${yearList}).`,
      });
    } else {
      checks.push("passed");
      reasons.push(`Year of study (Year ${studentYear}) is eligible.`);
      criteriaDetail.push({
        criterion:    "Year of Study",
        outcome:      "passed",
        required:     `Year ${yearList}`,
        studentValue: `Year ${studentYear}`,
        note:         `Year ${studentYear} is in the list of eligible years.`,
      });
    }
  }

  // ── Family Income ──────────────────────────────────────────────────────────
  if (criteria.maxFamilyIncome !== null && criteria.maxFamilyIncome !== undefined) {
    const studentIncome  = student.familyIncome;
    const formattedLimit = `₹${criteria.maxFamilyIncome.toLocaleString("en-IN")}`;

    if (studentIncome === null || studentIncome === undefined || studentIncome === "") {
      checks.push("missing");
      reasons.push("Your annual family income is not set in your profile.");
      criteriaDetail.push({
        criterion:    "Maximum Family Income",
        outcome:      "missing",
        required:     `≤ ${formattedLimit}`,
        studentValue: "Not set",
        note:         "Add your annual family income to your profile so this criterion can be evaluated.",
      });
    } else if (Number(studentIncome) > criteria.maxFamilyIncome) {
      checks.push("failed");
      reasons.push(
        `Maximum allowed annual family income is ₹${criteria.maxFamilyIncome.toLocaleString("en-IN")}. ` +
        `Your income is ₹${Number(studentIncome).toLocaleString("en-IN")}.`
      );
      criteriaDetail.push({
        criterion:    "Maximum Family Income",
        outcome:      "failed",
        required:     `≤ ${formattedLimit}`,
        studentValue: `₹${Number(studentIncome).toLocaleString("en-IN")}`,
        note:         `Your annual family income exceeds the maximum allowed by ₹${(Number(studentIncome) - criteria.maxFamilyIncome).toLocaleString("en-IN")}.`,
      });
    } else {
      checks.push("passed");
      reasons.push(
        `Family income requirement met ` +
        `(max ₹${criteria.maxFamilyIncome.toLocaleString("en-IN")}, ` +
        `yours ₹${Number(studentIncome).toLocaleString("en-IN")}).`
      );
      criteriaDetail.push({
        criterion:    "Maximum Family Income",
        outcome:      "passed",
        required:     `≤ ${formattedLimit}`,
        studentValue: `₹${Number(studentIncome).toLocaleString("en-IN")}`,
        note:         "Your annual family income is within the allowed limit.",
      });
    }
  }

  // ── Determine overall status (rules unchanged) ─────────────────────────────
  if (checks.includes("failed")) {
    return { status: "not-eligible", reasons, criteriaDetail };
  }

  if (checks.includes("missing") || checks.length === 0) {
    return {
      status: "needs-verification",
      reasons: reasons.length
        ? reasons
        : ["No structured eligibility conditions are defined for this scholarship."],
      criteriaDetail: criteriaDetail.length
        ? criteriaDetail
        : [
            {
              criterion:    "Structured Criteria",
              outcome:      "missing",
              required:     "N/A",
              studentValue: "N/A",
              note:         "No structured eligibility conditions are defined for this scholarship.",
            },
          ],
    };
  }

  return { status: "eligible", reasons, criteriaDetail };
}

module.exports = { evaluateEligibility };
