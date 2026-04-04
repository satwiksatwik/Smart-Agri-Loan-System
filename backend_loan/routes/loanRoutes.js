const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { body } = require("express-validator");
const { exec } = require("child_process");

const {
  applyForLoan,
  getUserLoans,
  getLoanSummary,
  getLoanDocument
} = require("../controllers/loanController");

/* =========================================================
   APPLY LOAN (ML + DOCUMENT REUSE + SAFE REUPLOAD)
========================================================= */
const multer = require("multer");

const uploadFields = upload.fields([
  { name: "adangal", maxCount: 1 },
  { name: "incomeCertificate", maxCount: 1 },
  { name: "aadhaar", maxCount: 1 },
  { name: "pan", maxCount: 1 },
  { name: "photo", maxCount: 1 },
  { name: "soilHealthCard", maxCount: 1 },
]);

// Wrapper to handle multer errors (File too large, etc.)
const safeUpload = (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "File too large. Maximum file size is 10MB per file.",
        });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post(
  "/apply",
  protect,
  safeUpload,
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("age").isInt({ min: 18, max: 100 }).withMessage("Age must be between 18 and 100"),
    body("mobile").isMobilePhone().withMessage("Invalid mobile number"),
    body("aadhaar").matches(/^\d{12}$/).withMessage("Aadhaar must be 12 digits"),
    body("pan").matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage("Invalid PAN format"),
    body("annualIncome").isFloat({ min: 0 }).withMessage("Invalid income"),
    body("creditScore").isInt({ min: 0, max: 900 }).withMessage("Credit score must be 0-900"),
    body("loanAmount").isFloat({ min: 1000 }).withMessage("Minimum loan amount is 1000"),
    body("purpose").trim().notEmpty().withMessage("Purpose is required"),
    body("landSize").isFloat({ min: 0 }).withMessage("Invalid land size"),
    body("ownership").isIn(['Owned', 'Leased', 'Shared']).withMessage("Invalid ownership type"),
  ],
  applyForLoan
);

/* =========================================================
   ML LOAN PREDICTION ROUTE
========================================================= */
router.post("/predict-loan", protect, (req, res) => {

  try {
    const inputData = JSON.stringify(req.body);

    exec(
      `python ../ml-api/predict.py '${inputData}'`,
      (error, stdout, stderr) => {

        if (error) {
          console.error("ML Error:", error);
          return res.status(500).json({
            status: "error",
            message: "Prediction failed",
            details: stderr
          });
        }

        return res.json({
          status: "success",
          predictedLoan: stdout.trim()
        });
      }
    );

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
});

/* =========================================================
   GET USER LOANS
========================================================= */
router.get("/my-loans", protect, getUserLoans);

/* =========================================================
   USER SUMMARY
========================================================= */
router.get("/summary", protect, getLoanSummary);

/* =========================================================
   SECURE DOCUMENT ACCESS
========================================================= */
router.get("/document/:filename", protect, getLoanDocument);

module.exports = router;