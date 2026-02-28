const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            "LOAN_APPLIED",
            "ML_EVALUATED",
            "MANAGER_APPROVED",
            "MANAGER_REJECTED",
            "BLOCKCHAIN_RECORDED",
            "EMI_PAID",
            "PDF_GENERATED",
            "STATUS_CHANGED",
            "LOGIN",
            "DOCUMENT_UPLOADED"
        ]
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    performedByRole: {
        type: String,
        enum: ["user", "admin", "bank_manager", "system"]
    },
    targetLoan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loan"
    },
    details: {
        type: String,
        default: ""
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

auditLogSchema.index({ targetLoan: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
