const Loan = require("../models/Loan");
const AuditLog = require("../models/AuditLog");

/* =========================================================
   💰 CALCULATE EMI (Standalone Calculator)
========================================================= */
const calculateEMI = (req, res) => {
    try {
        const { amount, rate, tenure } = req.body;
        if (!amount || !rate || !tenure) {
            return res.status(400).json({ message: "Amount, rate, and tenure are required" });
        }

        const P = Number(amount);
        const r = Number(rate) / 12 / 100;
        const n = Number(tenure);
        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - P;

        const schedule = [];
        let balance = P;
        for (let i = 1; i <= n; i++) {
            const interestPayment = balance * r;
            const principalPayment = emi - interestPayment;
            balance -= principalPayment;
            schedule.push({
                month: i,
                emi: Math.round(emi),
                principal: Math.round(principalPayment),
                interest: Math.round(interestPayment),
                balance: Math.max(0, Math.round(balance)),
            });
        }

        res.json({ emi: Math.round(emi), totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest), schedule });
    } catch (error) {
        console.error("EMI calculation error:", error);
        res.status(500).json({ message: "EMI calculation failed" });
    }
};

/* =========================================================
   📋 GET AMORTIZATION SCHEDULE (with Due Dates & Statuses)
========================================================= */
const getAmortizationSchedule = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.loanId);
        if (!loan) return res.status(404).json({ message: "Loan not found" });
        if (loan.status !== "Approved") {
            return res.status(400).json({ message: "Loan is not approved" });
        }

        const P = loan.approvedAmount;
        const r = (loan.interestRate || 8.5) / 12 / 100;
        const n = loan.tenure || 12;
        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const now = new Date();

        // Build schedule from the stored repayments
        const schedule = [];
        let balance = P;

        for (let i = 1; i <= n; i++) {
            const interestPayment = balance * r;
            const principalPayment = emi - interestPayment;
            balance -= principalPayment;

            const repayment = loan.repayments.find(rep => rep.emiNumber === i);
            const dueDate = repayment?.dueDate || null;
            const status = repayment?.status || "NOT_PAID";
            const isOverdue = dueDate && new Date(dueDate) < now && status !== "PAID";
            const canPayOnline = status === "NOT_PAID" && !isOverdue;

            schedule.push({
                month: i,
                emi: Math.round(emi),
                principal: Math.round(principalPayment),
                interest: Math.round(interestPayment),
                balance: Math.max(0, Math.round(balance)),
                dueDate,
                status,
                isOverdue,
                canPayOnline,
                paymentMethod: repayment?.paymentMethod || "",
                paymentId: repayment?.paymentId || "",
                transactionId: repayment?.transactionId || "",
                txHash: repayment?.txHash || "",
                paidDate: repayment?.paidDate || null,
            });
        }

        const paidCount = loan.repayments.filter(r => r.status === "PAID").length;
        const totalPaid = loan.repayments.filter(r => r.status === "PAID").reduce((sum, r) => sum + r.amount, 0);
        const outstanding = Math.max(0, Math.round(emi * n) - totalPaid);

        res.json({
            loanId: loan._id,
            applicationNumber: loan.applicationNumber,
            fullName: loan.fullName,
            approvedAmount: P,
            interestRate: loan.interestRate,
            tenure: n,
            emiAmount: Math.round(emi),
            emiDueDay: loan.emiDueDay || 10,
            paidCount,
            totalPaid,
            outstanding,
            schedule,
        });
    } catch (error) {
        console.error("Amortization error:", error);
        res.status(500).json({ message: "Failed to get schedule" });
    }
};

/* =========================================================
   💳 INITIATE ONLINE PAYMENT (Pay Now)
========================================================= */
const initiateOnlinePayment = async (req, res) => {
    try {
        const { emiNumber, paymentMethod } = req.body;
        const loan = await Loan.findById(req.params.loanId);

        if (!loan) return res.status(404).json({ message: "Loan not found" });
        if (loan.status !== "Approved") return res.status(400).json({ message: "Loan is not approved" });

        const repayment = loan.repayments.find(r => r.emiNumber === Number(emiNumber));
        if (!repayment) return res.status(404).json({ message: "EMI not found in schedule" });

        // Prevent duplicates
        if (repayment.status === "PAID") return res.status(400).json({ message: "This EMI is already paid" });
        if (repayment.status === "PENDING_APPROVAL") return res.status(400).json({ message: "Payment is already pending approval" });
        if (repayment.status === "VERIFICATION_REQUESTED") return res.status(400).json({ message: "Verification is already requested" });

        // Overdue check
        const now = new Date();
        if (repayment.dueDate && new Date(repayment.dueDate) < now) {
            return res.status(400).json({ message: "EMI is overdue. Please visit the bank and use Verify Payment instead." });
        }

        // Generate dummy payment IDs
        const payId = "PAY_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const txnId = "TXN_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8).toUpperCase();

        repayment.status = "PENDING_APPROVAL";
        repayment.paymentMethod = paymentMethod || "UPI";
        repayment.paymentId = payId;
        repayment.transactionId = txnId;
        repayment.paidDate = new Date();

        await loan.save();

        await AuditLog.create({
            action: "EMI_PAYMENT_INITIATED",
            performedBy: req.user._id,
            performedByRole: req.user.role,
            targetLoan: loan._id,
            details: `EMI #${emiNumber} online payment via ${paymentMethod}. Amount: ₹${repayment.amount}`,
            metadata: { paymentId: payId, transactionId: txnId },
        });

        res.json({
            message: "Payment submitted for manager approval",
            emiNumber,
            paymentId: payId,
            transactionId: txnId,
            status: "PENDING_APPROVAL",
        });
    } catch (error) {
        console.error("Online payment error:", error);
        res.status(500).json({ message: "Payment initiation failed" });
    }
};

/* =========================================================
   🏦 REQUEST VERIFICATION (Offline / Bank Payment)
========================================================= */
const requestVerification = async (req, res) => {
    try {
        const { emiNumber } = req.body;
        const loan = await Loan.findById(req.params.loanId);

        if (!loan) return res.status(404).json({ message: "Loan not found" });
        if (loan.status !== "Approved") return res.status(400).json({ message: "Loan is not approved" });

        const repayment = loan.repayments.find(r => r.emiNumber === Number(emiNumber));
        if (!repayment) return res.status(404).json({ message: "EMI not found in schedule" });

        if (repayment.status === "PAID") return res.status(400).json({ message: "This EMI is already paid" });
        if (repayment.status === "PENDING_APPROVAL") return res.status(400).json({ message: "An online payment is already pending" });
        if (repayment.status === "VERIFICATION_REQUESTED") return res.status(400).json({ message: "Verification is already requested" });

        repayment.status = "VERIFICATION_REQUESTED";
        repayment.paymentMethod = "Offline";
        repayment.paidDate = new Date();

        await loan.save();

        await AuditLog.create({
            action: "EMI_VERIFICATION_REQUESTED",
            performedBy: req.user._id,
            performedByRole: req.user.role,
            targetLoan: loan._id,
            details: `EMI #${emiNumber} offline verification requested. Amount: ₹${repayment.amount}`,
        });

        res.json({
            message: "Verification request sent to manager",
            emiNumber,
            status: "VERIFICATION_REQUESTED",
        });
    } catch (error) {
        console.error("Verification request error:", error);
        res.status(500).json({ message: "Verification request failed" });
    }
};

/* =========================================================
   ⏰ GET EMI ALERTS (7-day reminders for upcoming dues)
========================================================= */
const getEMIAlerts = async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user._id, status: "Approved" });
        const now = new Date();
        const alerts = [];

        for (const loan of loans) {
            for (const rep of loan.repayments) {
                if (rep.status !== "NOT_PAID") continue;
                if (!rep.dueDate) continue;

                const due = new Date(rep.dueDate);
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                const daysDiff = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

                if (daysDiff <= 7) {
                    let alertType = "reminder";
                    let msg = `Your EMI #${rep.emiNumber} of ₹${rep.amount.toLocaleString()} is due in ${daysDiff} days.`;

                    if (daysDiff < 0) {
                        alertType = "overdue";
                        msg = `OVERDUE: Your EMI #${rep.emiNumber} of ₹${rep.amount.toLocaleString()} was due ${Math.abs(daysDiff)} days ago! Please pay immediately.`;
                    } else if (daysDiff === 0) {
                        alertType = "urgent";
                        msg = `URGENT: Your EMI #${rep.emiNumber} of ₹${rep.amount.toLocaleString()} is due TODAY!`;
                    } else if (daysDiff <= 2) {
                        alertType = "high_priority";
                        msg = `HIGH PRIORITY: Your EMI #${rep.emiNumber} of ₹${rep.amount.toLocaleString()} is due in ${daysDiff} days!`;
                    }

                    alerts.push({
                        loanId: loan._id,
                        applicationNumber: loan.applicationNumber,
                        emiNumber: rep.emiNumber,
                        amount: rep.amount,
                        dueDate: rep.dueDate,
                        daysLeft: daysDiff,
                        type: alertType,
                        message: msg,
                    });
                }
            }
        }

        res.json(alerts);
    } catch (error) {
        console.error("EMI alerts error:", error);
        res.status(500).json({ message: "Failed to get alerts" });
    }
};

/* =========================================================
   📜 GET REPAYMENT HISTORY
========================================================= */
const getRepaymentHistory = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.loanId);
        if (!loan) return res.status(404).json({ message: "Loan not found" });

        res.json({
            loanId: loan._id,
            applicationNumber: loan.applicationNumber,
            repayments: loan.repayments || [],
            totalPaid: loan.repayments?.filter(r => r.status === "PAID").reduce((sum, r) => sum + r.amount, 0) || 0,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch repayment history" });
    }
};

module.exports = {
    calculateEMI,
    getAmortizationSchedule,
    initiateOnlinePayment,
    requestVerification,
    getEMIAlerts,
    getRepaymentHistory,
};
