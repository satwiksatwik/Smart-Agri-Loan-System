const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    calculateEMI,
    getAmortizationSchedule,
    recordEMIPayment,
    getRepaymentHistory,
} = require("../controllers/emiController");

// EMI Calculator (any authenticated user)
router.post("/calculate", protect, calculateEMI);

// Amortization schedule for a specific loan
router.get("/schedule/:loanId", protect, getAmortizationSchedule);

// Record EMI payment
router.post("/pay/:loanId", protect, recordEMIPayment);

// Repayment history
router.get("/history/:loanId", protect, getRepaymentHistory);

module.exports = router;
