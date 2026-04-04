const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    calculateEMI,
    getAmortizationSchedule,
    initiateOnlinePayment,
    requestVerification,
    getEMIAlerts,
    getRepaymentHistory,
} = require("../controllers/emiController");

// EMI Calculator
router.post("/calculate", protect, calculateEMI);

// Amortization schedule for a specific loan
router.get("/schedule/:loanId", protect, getAmortizationSchedule);

// Pay Now (Online Payment)
router.post("/pay-online/:loanId", protect, initiateOnlinePayment);

// Verify Payment (Offline / Bank)
router.post("/verify-offline/:loanId", protect, requestVerification);

// EMI Due Date Alerts (7-day reminders)
router.get("/alerts", protect, getEMIAlerts);

// Repayment history
router.get("/history/:loanId", protect, getRepaymentHistory);

module.exports = router;
