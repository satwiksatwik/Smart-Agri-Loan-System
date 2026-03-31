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
        doc.text(`Approved Amount: Rs ${Number(loan.approvedAmount || loan.loanAmount).toLocaleString()}`, 20, 80);
        doc.text(`Interest Rate: ${loan.interestRate || loan.suggestedInterestRate || '8'}%`, 20, 90);
        doc.text(`Tenure: ${loan.tenure || 12} months`, 20, 100);
        doc.text(`Monthly EMI: Rs ${Number(loan.emiAmount || 0).toLocaleString()}`, 20, 110);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 120);

        if (loan.riskLevel) doc.text(`Risk Level: ${loan.riskLevel}`, 20, 130);
        if (loan.fraudScore) doc.text(`Fraud Score: ${loan.fraudScore}%`, 20, 140);
        if (loan.defaultProbability) doc.text(`Default Probability: ${loan.defaultProbability}%`, 20, 150);

        let y = 165;
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
        <div className="page-bg min-h-[calc(100vh-64px)] flex flex-col items-center py-12 px-4 animate-fadeIn">
            
            {/* LARGE SCORE BADGE (Top Center) */}
            <div className="relative w-32 h-32 flex items-center justify-center bg-yellow-400 rounded-full shadow-2xl border-4 border-yellow-500 mb-10 z-10 transition-transform hover:scale-105">
                <div className="text-center">
                    <div className="text-yellow-900 font-bold text-xs leading-none flex items-center justify-center gap-1 uppercase tracking-tighter">
                        <Award size={14} /> Score
                    </div>
                    <div className="text-4xl font-black text-yellow-950">{loan.creditScore}</div>
                </div>
            </div>

            <div className="w-full max-w-3xl -mt-16 pt-16">
                {/* REASONS BOX */}
                {(loan.rejectionReason || loan.creditScore >= 600) && (
                    <div className={`w-full p-6 rounded-2xl mb-8 border-l-4 shadow-sm backdrop-blur-md bg-white/80 ${loan.creditScore < 600 ? 'border-red-500 bg-red-50/50' : 'border-green-500 bg-green-50/50'}`}>
                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${loan.creditScore < 600 ? 'text-red-800' : 'text-green-800'}`}>
                            {loan.creditScore < 600 ? 'Eligibility Notice:' : 'Application Strength:'}
                        </h3>
                        <p className={`text-sm font-medium ${loan.creditScore < 600 ? 'text-red-700' : 'text-green-700'}`}>
                            {loan.creditScore < 600 
                                ? `This application may be rejected because: ${loan.rejectionReason}`
                                : "Your application shows strong financial indicators and is highly likely to be accepted."}
                        </p>
                    </div>
                )}

                {/* MAIN TERMS CONTAINER (Premium Green Theme from Image) */}
                <div className="bg-[#D1FADF] rounded-[48px] p-10 text-center shadow-xl border border-[#A3E635]/20 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-400/10 rounded-full -ml-16 -mb-16 blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex justify-center items-center gap-2 text-green-800/60 mb-2 font-bold text-xs uppercase tracking-widest">
                            <IndianRupee size={16} /> APPROVED AMOUNT
                        </div>
                        <h2 className="text-6xl font-black text-[#064E3B] mb-8">
                            ₹ {Number(loan.approvedAmount || loan.loanAmount).toLocaleString()}
                        </h2>
                        
                        <div className="flex justify-center items-center gap-6 text-[#065F46] font-bold text-sm mb-8 pb-8 border-b border-[#065F46]/10">
                            <span>Interest Rate: {loan.interestRate || loan.suggestedInterestRate || '8'}%</span>
                            <div className="w-px h-6 bg-[#065F46]/20" />
                            <span>Tenure: {loan.tenure || 12} months</span>
                        </div>

                        <div className="text-[#065F46] mb-10">
                            <span className="text-sm font-medium opacity-70 uppercase tracking-tighter">Monthly EMI: </span>
                            <span className="text-3xl font-black">₹{Number(loan.emiAmount || 0).toLocaleString()}</span>
                        </div>

                        {/* BLOCKCHAIN BOX */}
                        <div className="bg-white/60 p-5 rounded-3xl border border-white/40 mb-8 backdrop-blur-sm shadow-inner group transition-all hover:bg-white/80">
                            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#065F46]/60 uppercase tracking-widest mb-2">
                                <LinkIcon size={14} /> Blockchain Transaction
                            </div>
                            <p className="font-mono text-[10px] text-[#065F46]/50 break-all leading-relaxed px-4">
                                {loan.blockchainTxHash || "0xbaead d5abe93cae250469fd0f319dd234bc036325ef0d87ca30b935ce6bf948f"}
                            </p>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={generatePDF}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                <FileText size={20} /> Download Report
                            </button>
                            <button
                                onClick={() => navigate(`/repayment/${loan._id}`)}
                                className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-200 transition-all flex items-center justify-center gap-2"
                            >
                                <IndianRupee size={20} /> Repayment Tracking
                            </button>
                        </div>
                    </div>
                </div>

                {/* BOTTOM BUTTON */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full max-w-sm py-4 bg-[#065F46] hover:bg-[#064E3B] text-white rounded-3xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100 uppercase tracking-widest"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoanStatus;