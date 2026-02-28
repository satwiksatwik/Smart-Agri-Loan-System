import React, { useEffect, useState } from "react";
import API from "../api";
import {
    CheckCircle,
    XCircle,
    IndianRupee,
    FileText,
    Award,
    AlertTriangle,
    Lightbulb,
    ArrowLeft,
    Hash,
    Clock,
    Link as LinkIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

const LoanStatus = () => {
    const [loan, setLoan] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLatestLoan = async () => {
            try {
                const { data } = await API.get("/loan/my-loans");
                if (data.length > 0) setLoan(data[0]);
            } catch (error) {
                console.error("Error fetching loan:", error);
            }
        };
        fetchLatestLoan();
    }, []);

    if (!loan) {
        return (
            <div className="text-center py-20 text-gray-600">
                No loan data found.
            </div>
        );
    }

    const isApproved = loan.status === "Approved";
    const isPending = loan.status === "Pending";
    const isRejected = loan.status === "Rejected";

    const getScoreColor = (score) => {
        if (score >= 750) return "bg-green-500 text-white";
        if (score >= 650) return "bg-yellow-400 text-black";
        return "bg-red-500 text-white";
    };

    const repaymentTips = [
        "Pay existing loans on time.",
        "Avoid taking multiple loans simultaneously.",
        "Increase stable agricultural income.",
        "Improve irrigation and crop stability.",
        "Maintain proper land ownership records."
    ];

    const generatePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Government Agricultural Credit Scheme", 20, 20);

        doc.setFontSize(12);
        doc.text(`Application No: ${loan.applicationNumber}`, 20, 35);

        doc.text(`Farmer Name: ${loan.fullName || "Applicant"}`, 20, 50);
        doc.text(`Credit Score: ${loan.creditScore}`, 20, 60);
        doc.text(`Status: ${loan.status}`, 20, 70);
        doc.text(`Approved Amount: Rs ${loan.approvedAmount}`, 20, 80);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 90);

        if (loan.riskLevel) doc.text(`Risk Level: ${loan.riskLevel}`, 20, 100);
        if (loan.fraudScore) doc.text(`Fraud Score: ${loan.fraudScore}%`, 20, 110);
        if (loan.defaultProbability) doc.text(`Default Probability: ${loan.defaultProbability}%`, 20, 120);

        let y = 135;
        if (loan.blockchainTxHash) {
            doc.text(`Blockchain Tx: ${loan.blockchainTxHash}`, 20, y, { maxWidth: 170 });
            y += 15;
        }

        doc.text(
            "This loan has been processed under the agricultural financial assistance program.",
            20, y, { maxWidth: 170 }
        );

        doc.text("Authorized Signature", 140, y + 25);
        doc.line(140, y + 30, 190, y + 30);

        doc.save("Loan_Report.pdf");
    };

    return (
        <div className="page-bg min-h-[calc(100vh-64px)] flex items-center justify-center px-4 animate-fadeIn">

            <div className="w-full max-w-2xl backdrop-blur-lg bg-white/90 
                            shadow-2xl rounded-3xl p-10 border border-white/40">

                {/* HEADER */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-extrabold text-green-800 flex justify-center items-center gap-2">
                        <Award className="text-yellow-600" />
                        Government Agricultural Credit Scheme
                    </h1>
                </div>

                {/* ✅ APPLICATION NUMBER BADGE */}
                {loan.applicationNumber && (
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-700 text-white px-6 py-2 rounded-full 
                                        shadow-md flex items-center gap-2 text-sm font-semibold">
                            <Hash size={16} />
                            Application No: {loan.applicationNumber}
                        </div>
                    </div>
                )}

                {/* STATUS ICON */}
                <div className="flex justify-center mb-6">
                    {isApproved ? (
                        <CheckCircle size={90} className="text-green-600 animate-bounce" />
                    ) : isPending ? (
                        <Clock size={90} className="text-yellow-500" />
                    ) : (
                        <XCircle size={90} className="text-red-600" />
                    )}
                </div>

                <h2 className={`text-4xl font-bold text-center mb-6 
                    ${isApproved ? "text-green-700" : isPending ? "text-yellow-600" : "text-red-700"}`}>
                    {isPending ? "Under Review" : `Loan ${loan.status}`}
                </h2>

                {/* CREDIT SCORE */}
                {loan.creditScore && (
                    <div className="flex justify-center mb-8">
                        <div className={`flex items-center gap-3 px-8 py-4 
                            rounded-full text-2xl font-bold shadow-lg 
                            ${getScoreColor(loan.creditScore)}`}>
                            <Award size={28} />
                            {loan.creditScore}
                        </div>
                    </div>
                )}

                {/* APPROVED */}
                {isApproved && (
                    <div className="bg-gradient-to-r from-green-100 to-green-200 
                                    p-8 rounded-2xl shadow-md text-center mb-6">

                        <div className="flex justify-center items-center gap-2 mb-2 text-gray-600">
                            <IndianRupee size={18} />
                            <span className="text-sm">APPROVED AMOUNT</span>
                        </div>

                        <h3 className="text-4xl font-extrabold text-green-800">
                            ₹ {Number(loan.approvedAmount || 0).toLocaleString()}
                        </h3>

                        {loan.emiAmount > 0 && (
                            <div className="mt-4 text-sm text-green-700">
                                <p>Interest Rate: {loan.interestRate}% | Tenure: {loan.tenure} months</p>
                                <p className="font-bold">Monthly EMI: ₹{loan.emiAmount?.toLocaleString()}</p>
                            </div>
                        )}

                        {loan.blockchainTxHash && (
                            <div className="mt-4 bg-white/70 p-3 rounded-xl">
                                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                    <LinkIcon size={12} /> Blockchain Transaction
                                </div>
                                <p className="font-mono text-xs text-gray-600 mt-1 break-all">
                                    {loan.blockchainTxHash}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center mt-6 flex-wrap">
                            <button
                                onClick={generatePDF}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 
                                           text-white rounded-xl shadow-md transition 
                                           flex items-center gap-2"
                            >
                                <FileText size={18} />
                                Download Report
                            </button>
                            <button
                                onClick={() => navigate(`/repayment/${loan._id}`)}
                                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 
                                           text-white rounded-xl shadow-md transition 
                                           flex items-center gap-2"
                            >
                                <IndianRupee size={18} />
                                Repayment Tracking
                            </button>
                        </div>
                    </div>
                )}

                {/* PENDING / UNDER REVIEW */}
                {isPending && (
                    <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 
                                    p-8 rounded-2xl shadow-md mb-6 text-center">
                        <div className="flex justify-center items-center gap-2 text-gray-600 mb-2">
                            <IndianRupee size={18} />
                            <span className="text-sm">REQUESTED AMOUNT</span>
                        </div>
                        <h3 className="text-3xl font-bold text-yellow-700 mb-4">
                            ₹ {Number(loan.loanAmount || 0).toLocaleString()}
                        </h3>
                        <p className="text-yellow-800 font-semibold">
                            Your application is currently being reviewed by a Bank Manager.
                        </p>
                        {loan.approvedAmount > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                                ML Recommended Amount: ₹{loan.approvedAmount?.toLocaleString()}
                            </p>
                        )}
                    </div>
                )}

                {/* REJECTED */}
                {isRejected && (
                    <div className="bg-gradient-to-r from-red-100 to-red-200 
                                    p-8 rounded-2xl shadow-md mb-6">

                        <div className="flex justify-center items-center gap-2 text-gray-600 mb-2">
                            <IndianRupee size={18} />
                            <span className="text-sm">REQUESTED AMOUNT</span>
                        </div>

                        <h3 className="text-3xl font-bold text-red-700 text-center mb-4">
                            ₹ {Number(loan.loanAmount || 0).toLocaleString()}
                        </h3>

                        {loan.rejectionReason && (
                            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <AlertTriangle size={16} />
                                    <span className="text-sm">Reason</span>
                                </div>
                                <p className="text-red-600 font-semibold">
                                    {loan.rejectionReason}
                                </p>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-2 mb-3 text-gray-700 font-bold">
                                <Lightbulb size={18} />
                                How to Improve Your Eligibility:
                            </div>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                {repaymentTips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-3 bg-green-700 hover:bg-green-800 
                               text-white rounded-xl text-lg font-semibold 
                               transition flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default LoanStatus;