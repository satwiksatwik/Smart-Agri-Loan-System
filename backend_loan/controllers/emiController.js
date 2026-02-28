const Loan = require("../models/Loan");
const AuditLog = require("../models/AuditLog");
const blockchainService = require("../services/blockchainService");

/* =========================================================
   💰 CALCULATE EMI
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

        // Amortization schedule
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

        res.json({
            emi: Math.round(emi),
            totalPayment: Math.round(totalPayment),
            totalInterest: Math.round(totalInterest),
            schedule,
        });
    } catch (error) {
        console.error("EMI calculation error:", error);
        res.status(500).json({ message: "EMI calculation failed" });
    }
};

/* =========================================================
   📋 GET AMORTIZATION SCHEDULE FOR A LOAN
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

        const schedule = [];
        let balance = P;

        for (let i = 1; i <= n; i++) {
            const interestPayment = balance * r;
            const principalPayment = emi - interestPayment;
            balance -= principalPayment;

            // Check if this EMI has been paid
            const existingRepayment = loan.repayments?.find(
                (rep) => rep.emiNumber === i
            );

            schedule.push({
                month: i,
                emi: Math.round(emi),
                principal: Math.round(principalPayment),
                interest: Math.round(interestPayment),
                balance: Math.max(0, Math.round(balance)),
                paid: !!existingRepayment,
                paidDate: existingRepayment?.date || null,
                txHash: existingRepayment?.txHash || null,
            });
        }

        const paidCount = loan.repayments?.length || 0;
        const totalPaid = loan.repayments?.reduce((sum, r) => sum + r.amount, 0) || 0;
        const outstanding = Math.round(P + (emi * n - P) - totalPaid);

        res.json({
            loanId: loan._id,
            applicationNumber: loan.applicationNumber,
            approvedAmount: P,
            interestRate: loan.interestRate,
            tenure: n,
            emiAmount: Math.round(emi),
            paidCount,
            totalPaid,
            outstanding: Math.max(0, outstanding),
            schedule,
        });
    } catch (error) {
        console.error("Amortization error:", error);
        res.status(500).json({ message: "Failed to get schedule" });
    }
};

/* =========================================================
   💵 RECORD EMI PAYMENT
========================================================= */
const recordEMIPayment = async (req, res) => {
    try {
        const { emiNumber } = req.body;
        const loan = await Loan.findById(req.params.loanId);

        if (!loan) return res.status(404).json({ message: "Loan not found" });
        if (loan.status !== "Approved") {
            return res.status(400).json({ message: "Loan is not approved" });
        }

        // Check if already paid
        const alreadyPaid = loan.repayments?.find(
            (r) => r.emiNumber === emiNumber
        );
        if (alreadyPaid) {
            return res.status(400).json({ message: "This EMI is already paid" });
        }

        // Calculate EMI amount
        const P = loan.approvedAmount;
        const r = (loan.interestRate || 8.5) / 12 / 100;
        const n = loan.tenure || 12;
        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const emiAmount = Math.round(emi);

        // Record on blockchain
        let blockchainResult = null;
        if (loan.blockchainLoanId) {
            try {
                blockchainResult = await blockchainService.recordRepaymentOnChain(
                    parseInt(loan.blockchainLoanId),
                    emiAmount,
                    emiNumber
                );
            } catch (bcError) {
                console.error("Blockchain repayment error:", bcError.message);
            }
        }

        // Save in DB
        if (!loan.repayments) loan.repayments = [];
        loan.repayments.push({
            amount: emiAmount,
            date: new Date(),
            emiNumber,
            txHash: blockchainResult?.txHash || "",
            status: "Paid",
        });

        await loan.save();

        // Audit log
        await AuditLog.create({
            action: "EMI_PAID",
            performedBy: req.user._id,
            performedByRole: req.user.role,
            targetLoan: loan._id,
            details: `EMI #${emiNumber} paid: ₹${emiAmount}`,
            metadata: { txHash: blockchainResult?.txHash || "" },
        });

        res.json({
            message: "EMI payment recorded successfully",
            emiNumber,
            amount: emiAmount,
            txHash: blockchainResult?.txHash || null,
        });
    } catch (error) {
        console.error("EMI payment error:", error);
        res.status(500).json({ message: "EMI payment failed" });
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
            totalPaid: loan.repayments?.reduce((sum, r) => sum + r.amount, 0) || 0,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch repayment history" });
    }
};

module.exports = {
    calculateEMI,
    getAmortizationSchedule,
    recordEMIPayment,
    getRepaymentHistory,
};
