const mongoose = require("mongoose");

const repaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  emiNumber: { type: Number, required: true },
  txHash: { type: String, default: "" },
  status: { type: String, enum: ["Paid", "Pending", "Late"], default: "Paid" },
});

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  applicationNumber: { type: String, required: true, unique: true },
  uniqueLoanId: { type: String, default: "" },

  // Farmer Details
  fullName: { type: String, required: true },
  age: { type: Number, required: true },
  mobile: { type: String, required: true },
  aadhaar: { type: String, required: true },
  pan: { type: String, required: true },

  // Financial Details
  annualIncome: { type: Number, required: true },
  creditScore: { type: Number, required: true },
  existingLoans: { type: Number, required: true },

  // Land Details
  landSize: { type: Number, required: true },
  landLocation: { type: String, required: true },
  soilQuality: { type: Number, required: true },
  irrigation: { type: String, required: true },
  ownership: { type: String, required: true },

  // Loan Details
  loanAmount: { type: Number, required: true },
  purpose: { type: String, required: true },
  loanType: { type: String, required: true },
  history: { type: String, default: "" },

  // ML & Approval Fields
  approvedAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  rejectionReason: { type: String, default: "" },

  // ML Enhanced Fields
  riskLevel: { type: String, enum: ["Low", "Medium", "High", ""], default: "" },
  mlConfidence: { type: Number, default: 0 },
  fraudScore: { type: Number, default: 0 },
  defaultProbability: { type: Number, default: 0 },
  suggestedInterestRate: { type: Number, default: 0 },

  // Blockchain Fields
  blockchainTxHash: { type: String, default: "" },
  blockchainLoanId: { type: String, default: "" },

  // Manager Review Fields
  managerNotes: { type: String, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },

  // EMI Fields
  interestRate: { type: Number, default: 0 },
  tenure: { type: Number, default: 0 },
  emiAmount: { type: Number, default: 0 },

  // Repayments
  repayments: [repaymentSchema],

  // Documents
  documentPaths: {
    adangal: { type: String },
    incomeCertificate: { type: String },
    aadhaar: { type: String },
    pan: { type: String },
    photo: { type: String }
  },

  // PDF
  pdfPath: { type: String, default: "" },

}, { timestamps: true });

module.exports = mongoose.model("Loan", loanSchema);