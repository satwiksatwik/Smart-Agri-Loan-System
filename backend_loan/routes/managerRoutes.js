const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { bankManager } = require("../middleware/adminMiddleware");
const {
    getManagerDashboard,
    getLoans,
    getLoanDetail,
    approveLoan,
    rejectLoan,
    generateLoanPDF,
    getBlockchainTransactions,
    getManagerDocument,
    getPendingEMIs,
    approveEMI,
    rejectEMI,
} = require("../controllers/managerController");

// All routes require authentication + bank_manager or admin role
router.use(protect, bankManager);

// Dashboard
router.get("/dashboard", getManagerDashboard);

// Loans
router.get("/loans", getLoans);
router.get("/loan/:id", getLoanDetail);

// Actions
router.put("/loan/:id/approve", approveLoan);
router.put("/loan/:id/reject", rejectLoan);

// PDF
router.get("/loan/:id/pdf", generateLoanPDF);

// Documents
router.get("/document/:filename", getManagerDocument);

// Blockchain Transactions
router.get("/blockchain/transactions", getBlockchainTransactions);

// EMI Approval Routes
router.get("/emi/pending", getPendingEMIs);
router.put("/emi/:loanId/approve", approveEMI);
router.put("/emi/:loanId/reject", rejectEMI);

module.exports = router;
