const Loan = require("../models/Loan");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { validationResult } = require("express-validator");
const transporter = require("../utils/mailer");
const blockchainService = require("../services/blockchainService");

/* =========================================================
   APPLY FOR LOAN
========================================================= */
const applyForLoan = async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(req.user._id).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "User not found" });
        }

        // Allow max 2 active loans per user
        const activeLoansCount = await Loan.countDocuments({
            userId: req.user._id,
            status: { $nin: ["Completed", "Rejected", "COMPLETED", "REJECTED"] }
        }).session(session);

        if (activeLoansCount >= 2) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "You already have 2 active loans. Please repay existing loans before applying for a new loan."
            });
        }

        const {
            fullName, age, mobile, aadhaar, pan, annualIncome, creditScore,
            existingLoans, landSize, landLocation, soilQuality, irrigation,
            ownership, loanAmount, purpose, loanType, tenure, history
        } = req.body;

        /* ================= EXTRA SECURITY VALIDATIONS ================= */

        if (!/^\d{12}$/.test(aadhaar)) {
            throw new Error("Invalid Aadhaar number. It must be 12 digits.");
        }

        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
            throw new Error("Invalid PAN format.");
        }

        if (!/^\d{10}$/.test(mobile)) {
            throw new Error("Invalid mobile number.");
        }

        if (Number(age) < 18 || Number(age) > 75) {
            throw new Error("Age must be between 18 and 75.");
        }

        /* ================= APPLICATION NUMBER ================= */
        const applicationNumber =
            "AGRI-" +
            new Date().getFullYear() +
            "-" +
            Date.now().toString().slice(-6);

        /* ================= DOCUMENT SYSTEM ================= */

        const documentPaths = {};
        const currentDocs = user.documents ? { ...user.documents } : {};

        const hasDoc = (field) =>
            currentDocs[field] && currentDocs[field].trim() !== "";

        const hasStoredDocs =
            hasDoc("adangal") &&
            hasDoc("incomeCertificate") &&
            hasDoc("aadhaar") &&
            hasDoc("pan") &&
            hasDoc("photo");

        const uploadedFiles = req.files || {};
        const fields = ["adangal", "incomeCertificate", "aadhaar", "pan", "photo", "soilHealthCard"];
        const newDocs = {};

        for (const field of fields) {
            if (uploadedFiles[field] && uploadedFiles[field][0]) {
                newDocs[field] = uploadedFiles[field][0].filename;
            } else if (hasDoc(field)) {
                newDocs[field] = currentDocs[field];
            } else {
                if (!hasStoredDocs && field !== "soilHealthCard") {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({
                        message: `Document ${field} is required.`
                    });
                }
            }
        }

        user.documents = { ...currentDocs, ...newDocs };
        await user.save({ session });

        Object.assign(documentPaths, user.documents);

        /* ================= ML INTEGRATION ================= */

        const mlData = {
            age: Number(age),
            annual_income: Number(annualIncome),
            credit_score: Number(creditScore),
            existing_loans: Number(existingLoans),
            land_size_acres: Number(landSize),
            soil_quality: Number(soilQuality),
            requested_amount: Number(loanAmount),
        };

        let approvedAmount = 0;
        let riskLevel = "";
        let mlConfidence = 0;
        let fraudScore = 0;
        let defaultProbability = 0;
        let suggestedInterestRate = 0;

        try {
            const mlUrl =
                process.env.ML_API_URL || "http://127.0.0.1:8000/predict";

            const mlResponse = await axios.post(mlUrl, mlData, {
                timeout: 10000,
            });

            if (mlResponse.data?.status === "success") {
                approvedAmount = Number(mlResponse.data.approved_amount) || 0;
                riskLevel = mlResponse.data.risk_level || "";
                mlConfidence = Number(mlResponse.data.ml_confidence) || 0;
                fraudScore = Number(mlResponse.data.fraud_score) || 0;
                defaultProbability = Number(mlResponse.data.default_probability) || 0;
                suggestedInterestRate = Number(mlResponse.data.suggested_interest_rate) || 0;
            }
        } catch (mlError) {
            console.error("ML API Error:", mlError.message);
        }

        // Calculate Preliminary EMI for Display
        let preliminaryEMI = 0;
        let preliminaryTenure = Number(tenure) || 12; // Use user-selected tenure
        if (approvedAmount > 0) {
            const totalMonthlyRate = (suggestedInterestRate / 100) / 12;
            const numerator = approvedAmount * totalMonthlyRate * Math.pow(1 + totalMonthlyRate, preliminaryTenure);
            const denominator = Math.pow(1 + totalMonthlyRate, preliminaryTenure) - 1;
            preliminaryEMI = Math.round(numerator / denominator);
        }

        /* ================= SAVE LOAN (Always Pending - Manager reviews) ================= */

        let computedRejectionReason = "";
        if (Number(creditScore) < 600) {
            const reasons = [];
            if (Number(existingLoans) > 1) reasons.push("Too many existing loans");
            else if (Number(existingLoans) > 0) reasons.push("Existing active loans");
            if (Number(annualIncome) < 50000) reasons.push("Annual income is critically low");
            if (Number(age) < 25) reasons.push("Applicant age is very low");
            if (Number(age) > 65) reasons.push("Applicant age is too high");
            if (Number(landSize) < 2) reasons.push("Insufficient land size");
            if (ownership === 'Leased') reasons.push("Leased land ownership carries higher risk");
            if (reasons.length === 0) reasons.push("Credit score is below minimum threshold");
            computedRejectionReason = reasons.join(", ");
        }

        const loan = await Loan.create(
            [{
                applicationNumber,
                userId: req.user._id,
                fullName,
                age: Number(age),
                mobile,
                aadhaar,
                pan,
                annualIncome: Number(annualIncome),
                creditScore: Number(creditScore),
                existingLoans: Number(existingLoans),
                landSize: Number(landSize),
                landLocation,
                soilQuality: Number(soilQuality),
                irrigation,
                ownership,
                loanAmount: Number(loanAmount),
                purpose,
                loanType,
                history,
                approvedAmount,
                status: "Pending", // Always Pending - Bank Manager will review
                rejectionReason: computedRejectionReason,
                riskLevel,
                mlConfidence,
                fraudScore,
                defaultProbability,
                suggestedInterestRate,
                documentPaths,
                interestRate: suggestedInterestRate,
                tenure: preliminaryTenure,
                emiAmount: preliminaryEMI,
            }],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        /* ================= BLOCKCHAIN STORAGE ================= */
        try {
            const bcResult = await blockchainService.createLoanOnChain(
                fullName,
                applicationNumber,
                Math.round(Number(loanAmount)),
                Number(creditScore),
                loanType
            );

            if (bcResult && bcResult.loanId) {
                loan[0].blockchainTxHash = bcResult.txHash;
                loan[0].blockchainLoanId = bcResult.loanId;
                await loan[0].save();
                console.log(`⛓️  Loan ${applicationNumber} recorded on blockchain. ID: ${bcResult.loanId}, Tx: ${bcResult.txHash}`);
            }
        } catch (bcError) {
            console.error("Blockchain error (non-fatal):", bcError.message);
        }

        /* ================= AUDIT LOG ================= */
        try {
            await AuditLog.create({
                action: "LOAN_APPLIED",
                performedBy: req.user._id,
                performedByRole: "user",
                targetLoan: loan[0]._id,
                details: `Application ${applicationNumber} submitted. Amount: ₹${loanAmount}`,
                metadata: {
                    mlApprovedAmount: approvedAmount,
                    riskLevel,
                    fraudScore,
                    blockchainTxHash: loan[0].blockchainTxHash || "",
                    blockchainLoanId: loan[0].blockchainLoanId || "",
                },
            });

            await AuditLog.create({
                action: "ML_EVALUATED",
                performedByRole: "system",
                targetLoan: loan[0]._id,
                details: `ML evaluated: Approved Amount ₹${approvedAmount}, Risk: ${riskLevel}, Fraud: ${fraudScore}%, Default: ${defaultProbability}%`,
            });
        } catch (auditErr) {
            console.error("Audit log error:", auditErr.message);
        }

        /* ================= EMAIL ================= */

        transporter
            .sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Loan Application Submitted - Under Review",
                html: `
                    <h2>Loan Application Received</h2>
                    <p>Application No: <strong>${applicationNumber}</strong></p>
                    <p>Amount Requested: <strong>₹${Number(loanAmount).toLocaleString()}</strong></p>
                    <p>ML Recommended Amount: <strong>₹${approvedAmount.toLocaleString()}</strong></p>
                    ${loan[0].blockchainTxHash ? `<p>Blockchain Tx: <code>${loan[0].blockchainTxHash}</code></p>` : ""}
                    <p>Your application is now under review by the Bank Manager.</p>
                `,
            })
            .catch((err) =>
                console.error("Email Error:", err)
            );

        return res.status(201).json(loan[0]);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Loan Application Error:", error.message);
        return res.status(400).json({
            message: error.message || "Server Error processing loan application",
        });
    }
};

/* =========================================================
   GET USER LOANS
========================================================= */
const getUserLoans = async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.json(loans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error fetching loans" });
    }
};

/* =========================================================
   GET LOAN SUMMARY
========================================================= */
const getLoanSummary = async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user._id });

        const totalApprovedAmount = loans
            .filter((l) => l.status === "Approved")
            .reduce((sum, loan) => sum + (loan.approvedAmount || 0), 0);

        const latestLoan = loans.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        const summary = {
            total: loans.length,
            approved: loans.filter((l) => l.status === "Approved").length,
            pending: loans.filter((l) => l.status === "Pending").length,
            rejected: loans.filter((l) => l.status === "Rejected").length,
            totalApprovedAmount,
            latestCreditScore: latestLoan?.creditScore || 0
        };

        res.json(summary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error fetching summary" });
    }
};

/* =========================================================
   GET DOCUMENT
========================================================= */
const getLoanDocument = async (req, res) => {
    try {
        const filename = req.params.filename;

        if (!filename || filename.includes("..") || filename.includes("/")) {
            return res.status(400).json({ message: "Invalid filename" });
        }

        const query = {
            $or: [
                { "documentPaths.adangal": filename },
                { "documentPaths.incomeCertificate": filename },
                { "documentPaths.aadhaar": filename },
                { "documentPaths.pan": filename },
                { "documentPaths.photo": filename },
                { "documentPaths.soilHealthCard": filename },
            ],
        };

        if (req.user.role !== "admin" && req.user.role !== "bank_manager") {
            query.userId = req.user._id;
        }

        const loan = await Loan.findOne(query);

        if (!loan && req.user.role !== "admin" && req.user.role !== "bank_manager") {
            return res.status(403).json({ message: "Access denied" });
        }

        const filePath = path.join(__dirname, "../uploads", filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found" });
        }

        res.sendFile(filePath);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "File access error" });
    }
};

module.exports = {
    applyForLoan,
    getUserLoans,
    getLoanSummary,
    getLoanDocument,
};