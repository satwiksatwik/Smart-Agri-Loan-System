const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const AuditLog = require("../models/AuditLog");

// Get all audit logs (admin only)
router.get("/logs", protect, admin, async (req, res) => {
    try {
        const { loanId, action, limit = 100 } = req.query;

        const filter = {};
        if (loanId) filter.targetLoan = loanId;
        if (action) filter.action = action;

        const logs = await AuditLog.find(filter)
            .populate("performedBy", "username role")
            .populate("targetLoan", "applicationNumber fullName")
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(logs);
    } catch (error) {
        console.error("Audit log error:", error);
        res.status(500).json({ message: "Failed to fetch audit logs" });
    }
});

module.exports = router;
