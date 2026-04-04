const Loan = require("../models/Loan");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const blockchainService = require("../services/blockchainService");
const transporter = require("../utils/mailer");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

/* =========================================================
   📊 MANAGER DASHBOARD
========================================================= */
const getManagerDashboard = async (req, res) => {
    try {
        const totalLoans = await Loan.countDocuments();
        const approvedLoans = await Loan.countDocuments({ status: "Approved" });
        const pendingLoans = await Loan.countDocuments({ status: "Pending" });
        const rejectedLoans = await Loan.countDocuments({ status: "Rejected" });

        const totalApprovedAmount = await Loan.aggregate([
            { $match: { status: "Approved" } },
            { $group: { _id: null, total: { $sum: "$approvedAmount" } } },
        ]);

        // Blockchain transaction count
        let blockchainTxCount = 0;
        try {
            blockchainTxCount = await blockchainService.getTransactionCount();
        } catch (e) {
            console.warn("Blockchain unavailable for tx count");
        }

        // Monthly loan data for charts
        const monthlyData = await Loan.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                        status: "$status",
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Loan type distribution
        const loanTypeDistribution = await Loan.aggregate([
            { $group: { _id: "$loanType", count: { $sum: 1 } } },
        ]);

        // Risk distribution
        const riskDistribution = await Loan.aggregate([
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ["$creditScore", 600] },
                            "High",
                            {
                                $cond: [
                                    { $lte: ["$creditScore", 750] },
                                    "Medium",
                                    "Low",
                                ],
                            },
                        ],
                    },
                    count: { $sum: 1 },
                },
            },
        ]);

        res.json({
            totalLoans,
            approvedLoans,
            pendingLoans,
            rejectedLoans,
            totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
            blockchainTxCount,
            monthlyData,
            loanTypeDistribution,
            riskDistribution,
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ message: "Dashboard fetch failed" });
    }
};

/* =========================================================
   📄 GET ALL LOANS (filterable)
========================================================= */
const getLoans = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const loans = await Loan.find(filter)
            .populate("userId", "username email")
            .sort({ createdAt: -1 });

        res.json(loans);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch loans" });
    }
};

/* =========================================================
   🔍 GET LOAN DETAIL
========================================================= */
const getLoanDetail = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate("userId", "username email mobile documents");

        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }

        // Get audit trail for this loan
        const auditTrail = await AuditLog.find({ targetLoan: loan._id })
            .populate("performedBy", "username role")
            .sort({ createdAt: -1 });

        res.json({ loan, auditTrail });
    } catch (error) {
        console.error("Loan detail error:", error);
        res.status(500).json({ message: "Failed to fetch loan details" });
    }
};

/* =========================================================
   ✅ APPROVE LOAN
========================================================= */
const approveLoan = async (req, res) => {
    try {
        const { approvedAmount, interestRate, tenure, managerNotes } = req.body;
        const loan = await Loan.findById(req.params.id);

        if (!loan) return res.status(404).json({ message: "Loan not found" });
        if (loan.status !== "Pending") {
            return res.status(400).json({ message: "Loan is not pending" });
        }

        // Calculate EMI
        const r = (interestRate || 8.5) / 12 / 100;
        const n = (tenure || 12);
        const P = approvedAmount || loan.approvedAmount || loan.loanAmount;
        const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);

        // Generate Unique Loan ID
        const uniqueLoanId = "LOAN-" + Date.now().toString(36).toUpperCase();

        // Store on blockchain
        let blockchainResult = null;
        let bcLoanId = loan.blockchainLoanId;

        try {
            // First create the loan on-chain if not already created
            if (!bcLoanId) {
                const createResult = await blockchainService.createLoanOnChain(
                    loan.fullName,
                    loan.applicationNumber,
                    Math.round(P),
                    loan.creditScore,
                    loan.loanType
                );

                if (createResult && createResult.loanId) {
                    bcLoanId = createResult.loanId;
                    loan.blockchainLoanId = bcLoanId;
                    // We can also store the creation hash if we want, but let's keep it consistent
                }
            }

            if (bcLoanId) {
                // Then approve it
                blockchainResult = await blockchainService.approveLoanOnChain(
                    parseInt(bcLoanId),
                    Math.round((interestRate || 8.5) * 100) // basis points
                );
            }
        } catch (bcError) {
            console.error("Blockchain error (non-fatal):", bcError.message);
        }

        // Update loan
        loan.status = "Approved";
        loan.approvedAmount = P;
        loan.interestRate = interestRate || 8.5;
        loan.tenure = tenure || 12;
        loan.emiAmount = Math.round(emi);
        loan.uniqueLoanId = uniqueLoanId;
        loan.managerNotes = managerNotes || "";
        loan.reviewedBy = req.user._id;
        loan.reviewedAt = new Date();
        loan.blockchainTxHash = blockchainResult?.txHash || "";

        // ✅ AUTO-GENERATE EMI SCHEDULE with due dates
        const emiDueDay = loan.emiDueDay || 10;
        const approvalDate = new Date();
        loan.repayments = [];
        for (let i = 1; i <= n; i++) {
            const dueMonth = approvalDate.getMonth() + i;
            const dueYear = approvalDate.getFullYear() + Math.floor(dueMonth / 12);
            const dueMonthNormalized = dueMonth % 12;
            const dueDate = new Date(dueYear, dueMonthNormalized, emiDueDay);
            loan.repayments.push({
                emiNumber: i,
                amount: Math.round(emi),
                dueDate,
                status: "NOT_PAID",
            });
        }

        await loan.save();

        // Audit log
        await AuditLog.create({
            action: "MANAGER_APPROVED",
            performedBy: req.user._id,
            performedByRole: req.user.role,
            targetLoan: loan._id,
            details: `Approved amount: ₹${P}, Interest: ${interestRate || 8.5}%, Tenure: ${tenure || 12} months`,
            metadata: { blockchainTxHash: blockchainResult?.txHash || "" },
        });

        // Email notification to farmer
        const farmer = await User.findById(loan.userId);
        if (farmer?.email) {
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: farmer.email,
                subject: "🎉 Loan Approved - Smart Agri Loan System",
                html: `
          <h2>Your Loan Has Been Approved!</h2>
          <p>Application No: <strong>${loan.applicationNumber}</strong></p>
          <p>Loan ID: <strong>${uniqueLoanId}</strong></p>
          <p>Approved Amount: <strong>₹${P.toLocaleString()}</strong></p>
          <p>Interest Rate: <strong>${interestRate || 8.5}%</strong></p>
          <p>Monthly EMI: <strong>₹${Math.round(emi).toLocaleString()}</strong></p>
          ${blockchainResult ? `<p>Blockchain Tx: <code>${blockchainResult.txHash}</code></p>` : ""}
        `,
            }).catch(err => console.error("Email error:", err));
        }

        res.json({
            message: "Loan approved successfully",
            loan,
            blockchainTxHash: blockchainResult?.txHash || null,
        });
    } catch (error) {
        console.error("Approve error:", error);
        res.status(500).json({ message: "Approval failed" });
    }
};

/* =========================================================
   ❌ REJECT LOAN
========================================================= */
const rejectLoan = async (req, res) => {
    try {
        const { rejectionReason, managerNotes } = req.body;
        const loan = await Loan.findById(req.params.id);

        if (!loan) return res.status(404).json({ message: "Loan not found" });
        if (loan.status !== "Pending") {
            return res.status(400).json({ message: "Loan is not pending" });
        }

        // Log rejection on blockchain
        let blockchainResult = null;
        let bcLoanId = loan.blockchainLoanId;

        try {
            if (!bcLoanId) {
                const createResult = await blockchainService.createLoanOnChain(
                    loan.fullName,
                    loan.applicationNumber,
                    Math.round(loan.loanAmount),
                    loan.creditScore,
                    loan.loanType
                );

                if (createResult && createResult.loanId) {
                    bcLoanId = createResult.loanId;
                    loan.blockchainLoanId = bcLoanId;
                }
            }

            if (bcLoanId) {
                blockchainResult = await blockchainService.rejectLoanOnChain(
                    parseInt(bcLoanId),
                    rejectionReason || "Rejected by Bank Manager"
                );
            }
        } catch (bcError) {
            console.error("Blockchain error (non-fatal):", bcError.message);
        }

        // Update loan
        loan.status = "Rejected";
        loan.rejectionReason = rejectionReason || "Rejected by Bank Manager";
        loan.managerNotes = managerNotes || "";
        loan.reviewedBy = req.user._id;
        loan.reviewedAt = new Date();
        loan.blockchainTxHash = blockchainResult?.txHash || "";

        await loan.save();

        // Audit log
        await AuditLog.create({
            action: "MANAGER_REJECTED",
            performedBy: req.user._id,
            performedByRole: req.user.role,
            targetLoan: loan._id,
            details: `Reason: ${rejectionReason}`,
            metadata: { blockchainTxHash: blockchainResult?.txHash || "" },
        });

        // Email notification
        const farmer = await User.findById(loan.userId);
        if (farmer?.email) {
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: farmer.email,
                subject: "Loan Application Update - Smart Agri Loan System",
                html: `
          <h2>Loan Application Status</h2>
          <p>Application No: <strong>${loan.applicationNumber}</strong></p>
          <p>Status: <strong style="color: red;">Rejected</strong></p>
          <p>Reason: ${rejectionReason || "Rejected by Bank Manager"}</p>
        `,
            }).catch(err => console.error("Email error:", err));
        }

        res.json({
            message: "Loan rejected",
            loan,
            blockchainTxHash: blockchainResult?.txHash || null,
        });
    } catch (error) {
        console.error("Reject error:", error);
        res.status(500).json({ message: "Rejection failed" });
    }
};

/* =========================================================
   📄 GENERATE PDF
========================================================= */
const generateLoanPDF = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate("userId", "username email")
            .populate("reviewedBy", "username");

        if (!loan) return res.status(404).json({ message: "Loan not found" });

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Loan_Report_${loan.applicationNumber}.pdf`
        );

        doc.pipe(res);

        // Header
        doc.fontSize(20).font("Helvetica-Bold")
            .text("Smart Agriculture Loan System", { align: "center" });
        doc.fontSize(14).font("Helvetica")
            .text("Government Agricultural Credit Scheme", { align: "center" });
        doc.moveDown();
        doc.fontSize(10).text(`Report Generated: ${new Date().toLocaleString()}`, { align: "right" });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Application Info
        doc.fontSize(14).font("Helvetica-Bold").text("Application Details");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");
        doc.text(`Application No: ${loan.applicationNumber}`);
        doc.text(`Status: ${loan.status}`);
        if (loan.uniqueLoanId) doc.text(`Loan ID: ${loan.uniqueLoanId}`);
        doc.moveDown();

        // Farmer Details
        doc.fontSize(14).font("Helvetica-Bold").text("Farmer Details");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");
        doc.text(`Name: ${loan.fullName}`);
        doc.text(`Age: ${loan.age}`);
        doc.text(`Mobile: ${loan.mobile}`);
        doc.text(`Aadhaar: ${loan.aadhaar ? "XXXX-XXXX-" + loan.aadhaar.slice(-4) : "N/A"}`);
        doc.text(`PAN: ${loan.pan ? loan.pan.slice(0, 2) + "XXXXX" + loan.pan.slice(-2) : "N/A"}`);
        doc.moveDown();

        // Financial Details
        doc.fontSize(14).font("Helvetica-Bold").text("Financial Details");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");
        doc.text(`Annual Income: Rs. ${loan.annualIncome?.toLocaleString()}`);
        doc.text(`Credit Score: ${loan.creditScore}`);
        doc.text(`Existing Loans: ${loan.existingLoans}`);
        doc.text(`Requested Amount: Rs. ${loan.loanAmount?.toLocaleString()}`);
        if (loan.status === "Approved") {
            doc.text(`Approved Amount: Rs. ${loan.approvedAmount?.toLocaleString()}`);
            doc.text(`Interest Rate: ${loan.interestRate || "N/A"}%`);
            doc.text(`Tenure: ${loan.tenure || "N/A"} months`);
            doc.text(`Monthly EMI: Rs. ${loan.emiAmount?.toLocaleString() || "N/A"}`);
        }
        doc.moveDown();

        // ML Analysis
        doc.fontSize(14).font("Helvetica-Bold").text("ML Risk Analysis");
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica");
        doc.text(`Risk Level: ${loan.riskLevel || "N/A"}`);
        doc.text(`Fraud Score: ${loan.fraudScore || "N/A"}`);
        doc.text(`Default Probability: ${loan.defaultProbability || "N/A"}%`);
        doc.text(`ML Confidence: ${loan.mlConfidence || "N/A"}%`);
        doc.moveDown();

        // Blockchain Info
        if (loan.blockchainTxHash) {
            doc.fontSize(14).font("Helvetica-Bold").text("Blockchain Record");
            doc.moveDown(0.5);
            doc.fontSize(10).font("Helvetica");
            doc.text(`Transaction Hash: ${loan.blockchainTxHash}`);
            doc.text(`Blockchain Loan ID: ${loan.blockchainLoanId || "N/A"}`);
            doc.moveDown();
        }

        // Manager Decision
        if (loan.reviewedBy) {
            doc.fontSize(14).font("Helvetica-Bold").text("Manager Decision");
            doc.moveDown(0.5);
            doc.fontSize(10).font("Helvetica");
            doc.text(`Reviewed By: ${loan.reviewedBy?.username || "N/A"}`);
            doc.text(`Reviewed At: ${loan.reviewedAt ? new Date(loan.reviewedAt).toLocaleString() : "N/A"}`);
            if (loan.managerNotes) doc.text(`Notes: ${loan.managerNotes}`);
            if (loan.rejectionReason) doc.text(`Rejection Reason: ${loan.rejectionReason}`);
        }

        // Footer
        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
        doc.fontSize(8).text("This is a system-generated document.", { align: "center" });
        doc.text("Digital Signature Section: ___________________", { align: "center" });

        doc.end();

    } catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({ message: "PDF generation failed" });
    }
};

/* =========================================================
   ⛓️ GET BLOCKCHAIN TRANSACTIONS
========================================================= */
const getBlockchainTransactions = async (req, res) => {
    try {
        const transactions = await blockchainService.getTransactionHistory();
        res.json(transactions);
    } catch (error) {
        console.error("Blockchain transactions error:", error);
        res.status(500).json({ message: "Failed to fetch blockchain transactions" });
    }
};

/* =========================================================
   📄 GET DOCUMENT FILE (for admin/manager viewing)
========================================================= */
const getManagerDocument = async (req, res) => {
    try {
        const filename = req.params.filename;

        if (!filename || filename.includes("..") || filename.includes("/")) {
            return res.status(400).json({ message: "Invalid filename" });
        }

        const filePath = path.join(__dirname, "../uploads", filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found" });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error("Document access error:", error);
        res.status(500).json({ message: "File access error" });
    }
};

/* =========================================================
   📋 GET PENDING EMI PAYMENTS (for manager approval)
========================================================= */
const getPendingEMIs = async (req, res) => {
    try {
        const loans = await Loan.find({
            status: "Approved",
            "repayments.status": { $in: ["PENDING_APPROVAL", "VERIFICATION_REQUESTED"] },
        }).populate("userId", "username email");

        const pendingEMIs = [];
        for (const loan of loans) {
            for (const rep of loan.repayments) {
                if (rep.status === "PENDING_APPROVAL" || rep.status === "VERIFICATION_REQUESTED") {
                    pendingEMIs.push({
                        loanId: loan._id,
                        applicationNumber: loan.applicationNumber,
                        farmerName: loan.fullName,
                        emiNumber: rep.emiNumber,
                        amount: rep.amount,
                        dueDate: rep.dueDate,
                        status: rep.status,
                        paymentMethod: rep.paymentMethod,
                        paymentId: rep.paymentId,
                        transactionId: rep.transactionId,
                        paidDate: rep.paidDate,
                        repaymentId: rep._id,
                    });
                }
            }
        }

        res.json(pendingEMIs);
    } catch (error) {
        console.error("Pending EMIs error:", error);
        res.status(500).json({ message: "Failed to fetch pending EMIs" });
    }
};

/* =========================================================
   ✅ APPROVE EMI PAYMENT
========================================================= */
const approveEMI = async (req, res) => {
    try {
        const { emiNumber } = req.body;
        const loan = await Loan.findById(req.params.loanId);
        if (!loan) return res.status(404).json({ message: "Loan not found" });

        const repayment = loan.repayments.find(r => r.emiNumber === Number(emiNumber));
        if (!repayment) return res.status(404).json({ message: "EMI not found" });
        if (repayment.status === "PAID") return res.status(400).json({ message: "Already paid" });
        if (repayment.status === "NOT_PAID") return res.status(400).json({ message: "No payment to approve" });

        // Record on blockchain
        let blockchainResult = null;
        if (loan.blockchainLoanId) {
            try {
                blockchainResult = await blockchainService.recordRepaymentOnChain(
                    parseInt(loan.blockchainLoanId),
                    repayment.amount,
                    emiNumber
                );
            } catch (bcError) {
                console.error("Blockchain repayment error:", bcError.message);
            }
        }

        repayment.status = "PAID";
        repayment.approvedBy = req.user._id;
        repayment.approvedAt = new Date();
        repayment.txHash = blockchainResult?.txHash || "";

        const allPaid = loan.repayments.every(r => r.status === "PAID");
        if (allPaid) {
            loan.status = "Completed";
        }

        await loan.save();

        await AuditLog.create({
            action: "EMI_APPROVED",
            performedBy: req.user._id,
            performedByRole: req.user.role,
            targetLoan: loan._id,
            details: `EMI #${emiNumber} approved. Amount: ₹${repayment.amount}`,
            metadata: { txHash: blockchainResult?.txHash || "" },
        });

        res.json({
            message: `EMI #${emiNumber} approved successfully`,
            txHash: blockchainResult?.txHash || null,
        });
    } catch (error) {
        console.error("Approve EMI error:", error);
        res.status(500).json({ message: "EMI approval failed" });
    }
};

/* =========================================================
   ❌ REJECT EMI PAYMENT
========================================================= */
const rejectEMI = async (req, res) => {
    try {
        const { emiNumber } = req.body;
        const loan = await Loan.findById(req.params.loanId);
        if (!loan) return res.status(404).json({ message: "Loan not found" });

        const repayment = loan.repayments.find(r => r.emiNumber === Number(emiNumber));
        if (!repayment) return res.status(404).json({ message: "EMI not found" });

        repayment.status = "NOT_PAID";
        repayment.paymentMethod = "";
        repayment.paymentId = "";
        repayment.transactionId = "";
        repayment.paidDate = null;

        await loan.save();

        await AuditLog.create({
            action: "EMI_REJECTED",
            performedBy: req.user._id,
            performedByRole: req.user.role,
            targetLoan: loan._id,
            details: `EMI #${emiNumber} payment rejected. User can retry.`,
        });

        res.json({ message: `EMI #${emiNumber} rejected. User can retry payment.` });
    } catch (error) {
        console.error("Reject EMI error:", error);
        res.status(500).json({ message: "EMI rejection failed" });
    }
};

module.exports = {
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
};
