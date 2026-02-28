import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminAPI from "../adminApi";
import {
    CheckCircle, XCircle, ArrowLeft, FileText, Download,
    Shield, TrendingUp, IndianRupee, User,
    MapPin, Landmark, Hash, Clock, Eye, X
} from "lucide-react";

const ManagerLoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [auditTrail, setAuditTrail] = useState([]);
    const [loading, setLoading] = useState(true);

    // Approve modal state
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveData, setApproveData] = useState({
        approvedAmount: "",
        interestRate: "",
        tenure: "12",
        managerNotes: "",
    });

    // Reject modal state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectData, setRejectData] = useState({
        rejectionReason: "",
        managerNotes: "",
    });

    const [actionLoading, setActionLoading] = useState(false);

    // Document preview state
    const [previewDoc, setPreviewDoc] = useState(null);

    const fetchLoanDetail = useCallback(async () => {
        try {
            const { data } = await AdminAPI.get(`/manager/loan/${id}`);
            setLoan(data.loan);
            setAuditTrail(data.auditTrail || []);

            setApproveData(prev => ({
                ...prev,
                approvedAmount: data.loan.approvedAmount || data.loan.loanAmount,
                interestRate: data.loan.suggestedInterestRate || 8.5,
            }));
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLoanDetail();
    }, [fetchLoanDetail]);

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            const { data } = await AdminAPI.put(`/manager/loan/${id}/approve`, approveData);
            alert(`✅ Loan Approved! ${data.blockchainTxHash ? `\nBlockchain Tx: ${data.blockchainTxHash}` : ""}`);
            setShowApproveModal(false);
            fetchLoanDetail();
        } catch (error) {
            alert("❌ Approval failed: " + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        setActionLoading(true);
        try {
            await AdminAPI.put(`/manager/loan/${id}/reject`, rejectData);
            alert("Loan rejected successfully.");
            setShowRejectModal(false);
            fetchLoanDetail();
        } catch (error) {
            alert("Rejection failed: " + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            const response = await AdminAPI.get(`/manager/loan/${id}/pdf`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Loan_Report_${loan.applicationNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("PDF download failed");
        }
    };

    const openDocPreview = async (docType, filename) => {
        if (!filename) return;
        try {
            const response = await AdminAPI.get(`/manager/document/${filename}`, {
                responseType: "blob",
            });
            const blobUrl = window.URL.createObjectURL(response.data);
            setPreviewDoc({ name: docType, filename, blobUrl, mimeType: response.data.type });
        } catch (error) {
            console.error("Document fetch error:", error);
            alert("Failed to load document. It may have been deleted.");
        }
    };

    const isImage = (filename, mimeType) => {
        if (mimeType) return mimeType.startsWith("image/");
        if (!filename) return false;
        const ext = filename.split(".").pop().toLowerCase();
        return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    };

    const isPdf = (filename, mimeType) => {
        if (mimeType) return mimeType === "application/pdf";
        if (!filename) return false;
        return filename.split(".").pop().toLowerCase() === "pdf";
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!loan) return <div className="text-center py-20 text-red-500">Loan not found</div>;

    const getRiskColor = (level) => {
        if (level === "Low") return "bg-green-100 text-green-700";
        if (level === "Medium") return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    };

    const docLabels = {
        adangal: "Adangal (Land Record)",
        incomeCertificate: "Income Certificate",
        aadhaar: "Aadhaar Card",
        pan: "PAN Card",
        photo: "Passport Photo",
    };

    return (
        <div className="p-6 max-w-5xl mx-auto animate-fadeIn">
            {/* Back Button */}
            <button onClick={() => navigate("/manager/dashboard")}
                className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 font-semibold">
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-green-800">{loan.fullName}</h1>
                        <p className="text-gray-500 flex items-center gap-1 mt-1">
                            <Hash size={14} /> {loan.applicationNumber}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <span className={`px-4 py-2 rounded-full font-bold
                            ${loan.status === "Approved" ? "bg-green-100 text-green-700"
                                : loan.status === "Rejected" ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"}`}>
                            {loan.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Farmer Info */}
                <DetailCard title="Farmer Details" icon={<User />}>
                    <InfoRow label="Name" value={loan.fullName} />
                    <InfoRow label="Age" value={loan.age} />
                    <InfoRow label="Mobile" value={loan.mobile} />
                    <InfoRow label="Aadhaar" value={loan.aadhaar ? "XXXX-XXXX-" + loan.aadhaar.slice(-4) : "N/A"} />
                    <InfoRow label="PAN" value={loan.pan ? loan.pan.slice(0, 2) + "XXXXX" + loan.pan.slice(-2) : "N/A"} />
                </DetailCard>

                {/* Financial Info */}
                <DetailCard title="Financial Details" icon={<IndianRupee />}>
                    <InfoRow label="Annual Income" value={`₹${loan.annualIncome?.toLocaleString()}`} />
                    <InfoRow label="Credit Score" value={loan.creditScore} />
                    <InfoRow label="Existing Loans" value={loan.existingLoans} />
                    <InfoRow label="Requested Amount" value={`₹${loan.loanAmount?.toLocaleString()}`} />
                    <InfoRow label="ML Approved Amount" value={`₹${loan.approvedAmount?.toLocaleString()}`} />
                </DetailCard>

                {/* Land Info */}
                <DetailCard title="Land Details" icon={<MapPin />}>
                    <InfoRow label="Land Size" value={`${loan.landSize} acres`} />
                    <InfoRow label="Location" value={loan.landLocation} />
                    <InfoRow label="Soil Quality" value={`${loan.soilQuality}/10`} />
                    <InfoRow label="Irrigation" value={loan.irrigation} />
                    <InfoRow label="Ownership" value={loan.ownership} />
                </DetailCard>

                {/* ML Analysis */}
                <DetailCard title="ML Risk Analysis" icon={<Shield />}>
                    <InfoRow label="Risk Level" value={
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRiskColor(loan.riskLevel)}`}>
                            {loan.riskLevel || "N/A"}
                        </span>
                    } />
                    <InfoRow label="Fraud Score" value={`${loan.fraudScore || 0}%`} />
                    <InfoRow label="Default Probability" value={`${loan.defaultProbability || 0}%`} />
                    <InfoRow label="ML Confidence" value={`${loan.mlConfidence || 0}%`} />
                    <InfoRow label="Suggested Interest Rate" value={`${loan.suggestedInterestRate || 0}%`} />
                </DetailCard>

                {/* Loan Info */}
                <DetailCard title="Loan Details" icon={<Landmark />}>
                    <InfoRow label="Loan Type" value={loan.loanType?.replace(/_/g, " ")} />
                    <InfoRow label="Purpose" value={loan.purpose?.replace(/_/g, " ")} />
                    <InfoRow label="Loan History" value={loan.history?.replace(/_/g, " ")} />
                    {loan.interestRate > 0 && <InfoRow label="Interest Rate" value={`${loan.interestRate}%`} />}
                    {loan.tenure > 0 && <InfoRow label="Tenure" value={`${loan.tenure} months`} />}
                    {loan.emiAmount > 0 && <InfoRow label="Monthly EMI" value={`₹${loan.emiAmount?.toLocaleString()}`} />}
                </DetailCard>

                {/* Blockchain Info */}
                <DetailCard title="Blockchain Record" icon={<TrendingUp />}>
                    <InfoRow label="Blockchain Tx Hash" value={
                        loan.blockchainTxHash
                            ? <span className="font-mono text-xs break-all">{loan.blockchainTxHash}</span>
                            : "Not recorded yet"
                    } />
                    <InfoRow label="Blockchain Loan ID" value={loan.blockchainLoanId || "N/A"} />
                    {loan.uniqueLoanId && <InfoRow label="Unique Loan ID" value={loan.uniqueLoanId} />}
                </DetailCard>
            </div>

            {/* Document Verification — Clickable with Preview */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText size={18} /> Document Verification
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {["adangal", "incomeCertificate", "aadhaar", "pan", "photo"].map(docType => {
                        const filename = loan.documentPaths?.[docType];
                        const hasDoc = !!filename;
                        return (
                            <div
                                key={docType}
                                onClick={() => hasDoc && openDocPreview(docType, filename)}
                                className={`p-3 rounded-xl text-center transition-all
                                    ${hasDoc
                                        ? "bg-green-50 border border-green-200 cursor-pointer hover:shadow-md hover:bg-green-100"
                                        : "bg-red-50 border border-red-200"}`}
                            >
                                <p className="text-sm font-semibold">{docLabels[docType] || docType}</p>
                                <p className={`text-xs mt-1 ${hasDoc ? "text-green-700" : "text-red-700"}`}>
                                    {hasDoc ? "✅ Uploaded" : "❌ Missing"}
                                </p>
                                {hasDoc && (
                                    <div className="mt-2 flex items-center justify-center gap-1 text-green-600 text-xs font-semibold">
                                        <Eye size={12} /> Click to View
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <button onClick={downloadPDF}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg">
                    <Download size={18} /> Download PDF Report
                </button>

                {loan.status === "Pending" && (
                    <>
                        <button onClick={() => setShowApproveModal(true)}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2 shadow-lg">
                            <CheckCircle size={18} /> Approve Loan
                        </button>
                        <button onClick={() => setShowRejectModal(true)}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2 shadow-lg">
                            <XCircle size={18} /> Reject Loan
                        </button>
                    </>
                )}
            </div>

            {/* Audit Trail */}
            {auditTrail.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock size={18} /> Audit Trail
                    </h3>
                    <div className="space-y-3">
                        {auditTrail.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className={`w-2 h-2 rounded-full mt-2 ${log.action.includes("APPROVED") ? "bg-green-500"
                                    : log.action.includes("REJECTED") ? "bg-red-500"
                                        : "bg-blue-500"
                                    }`} />
                                <div>
                                    <p className="text-sm font-semibold">{log.action.replace(/_/g, " ")}</p>
                                    <p className="text-xs text-gray-500">{log.details}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {log.performedBy?.username || "System"} • {new Date(log.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================= APPROVE MODAL ================= */}
            {showApproveModal && (
                <Modal title="Approve Loan" onClose={() => setShowApproveModal(false)}>
                    <div className="space-y-4">
                        <InputField label="Approved Amount (₹)" type="number"
                            value={approveData.approvedAmount}
                            onChange={e => setApproveData({ ...approveData, approvedAmount: e.target.value })} />
                        <InputField label="Interest Rate (%)" type="number"
                            value={approveData.interestRate}
                            onChange={e => setApproveData({ ...approveData, interestRate: e.target.value })} />
                        <InputField label="Tenure (months)" type="number"
                            value={approveData.tenure}
                            onChange={e => setApproveData({ ...approveData, tenure: e.target.value })} />
                        <InputField label="Manager Notes" type="text"
                            value={approveData.managerNotes}
                            onChange={e => setApproveData({ ...approveData, managerNotes: e.target.value })} />
                        <button onClick={handleApprove} disabled={actionLoading}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition">
                            {actionLoading ? "Processing..." : "✅ Confirm Approval"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ================= REJECT MODAL ================= */}
            {showRejectModal && (
                <Modal title="Reject Loan" onClose={() => setShowRejectModal(false)}>
                    <div className="space-y-4">
                        <InputField label="Rejection Reason" type="text"
                            value={rejectData.rejectionReason}
                            onChange={e => setRejectData({ ...rejectData, rejectionReason: e.target.value })} />
                        <InputField label="Manager Notes" type="text"
                            value={rejectData.managerNotes}
                            onChange={e => setRejectData({ ...rejectData, managerNotes: e.target.value })} />
                        <button onClick={handleReject} disabled={actionLoading}
                            className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
                            {actionLoading ? "Processing..." : "❌ Confirm Rejection"}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ================= DOCUMENT PREVIEW MODAL ================= */}
            {previewDoc && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={() => { if (previewDoc.blobUrl) window.URL.revokeObjectURL(previewDoc.blobUrl); setPreviewDoc(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FileText size={18} />
                                {docLabels[previewDoc.name] || previewDoc.name}
                            </h3>
                            <button
                                onClick={() => { if (previewDoc.blobUrl) window.URL.revokeObjectURL(previewDoc.blobUrl); setPreviewDoc(null); }}
                                className="p-2 hover:bg-gray-200 rounded-full transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex items-center justify-center overflow-auto"
                            style={{ maxHeight: "calc(90vh - 80px)" }}>
                            {isImage(previewDoc.filename, previewDoc.mimeType) ? (
                                <img
                                    src={previewDoc.blobUrl}
                                    alt={previewDoc.name}
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow"
                                />
                            ) : isPdf(previewDoc.filename, previewDoc.mimeType) ? (
                                <iframe
                                    src={previewDoc.blobUrl}
                                    title={previewDoc.name}
                                    className="w-full rounded-lg"
                                    style={{ height: "70vh" }}
                                />
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                                    <p>Preview not available for this file type.</p>
                                    <a
                                        href={previewDoc.blobUrl}
                                        download={previewDoc.filename}
                                        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg"
                                    >
                                        Download File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusable components
const DetailCard = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-800">
            {icon} {title}
        </h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-1 border-b border-gray-50">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
);

const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{title}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            {children}
        </div>
    </div>
);

const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
    </div>
);

export default ManagerLoanDetail;
