import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import {
    ArrowLeft, IndianRupee, CheckCircle, Clock,
    Hash, Calendar, Link as LinkIcon
} from "lucide-react";

const RepaymentTracking = () => {
    const { loanId } = useParams();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        fetchSchedule();
    }, [loanId]);

    const fetchSchedule = async () => {
        try {
            const { data } = await API.get(`/emi/schedule/${loanId}`);
            setSchedule(data);
        } catch (error) {
            console.error("Schedule fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayEMI = async (emiNumber) => {
        if (!window.confirm(`Pay EMI #${emiNumber}?`)) return;
        setPaying(true);
        try {
            const { data } = await API.post(`/emi/pay/${loanId}`, { emiNumber });
            alert(`✅ EMI #${emiNumber} paid! ${data.txHash ? `\nBlockchain Tx: ${data.txHash}` : ""}`);
            fetchSchedule();
        } catch (error) {
            alert("Payment failed: " + (error.response?.data?.message || error.message));
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!schedule) return <div className="text-center py-20 text-red-500">Schedule not found</div>;

    const paidPercentage = Math.round((schedule.paidCount / schedule.schedule.length) * 100);

    return (
        <div className="page-bg min-h-[calc(100vh-64px)] py-12 px-4 animate-fadeIn">
            <div className="max-w-4xl mx-auto">

                <button onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 font-semibold">
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-green-800">
                        Repayment Tracking
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center justify-center gap-1">
                        <Hash size={14} /> {schedule.applicationNumber}
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <SummaryCard label="Loan Amount" value={`₹${schedule.approvedAmount?.toLocaleString()}`} bg="bg-blue-50" text="text-blue-700" />
                    <SummaryCard label="Monthly EMI" value={`₹${schedule.emiAmount?.toLocaleString()}`} bg="bg-green-50" text="text-green-700" />
                    <SummaryCard label="Total Paid" value={`₹${schedule.totalPaid?.toLocaleString()}`} bg="bg-purple-50" text="text-purple-700" />
                    <SummaryCard label="Outstanding" value={`₹${schedule.outstanding?.toLocaleString()}`} bg="bg-red-50" text="text-red-700" />
                </div>

                {/* Progress Bar */}
                <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-600">
                            Repayment Progress
                        </span>
                        <span className="text-sm font-bold text-green-700">
                            {schedule.paidCount} / {schedule.schedule.length} EMIs ({paidPercentage}%)
                        </span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                            style={{ width: `${paidPercentage}%` }} />
                    </div>
                </div>

                {/* Schedule Table */}
                <div className="bg-white/90 rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-bold mb-4 text-green-700">Payment Schedule</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-gray-500">
                                    <th className="p-3">EMI #</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Principal</th>
                                    <th className="p-3">Interest</th>
                                    <th className="p-3">Balance</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule.schedule.map(row => (
                                    <tr key={row.month} className={`border-b ${row.paid ? "bg-green-50" : "hover:bg-gray-50"}`}>
                                        <td className="p-3 font-mono">#{row.month}</td>
                                        <td className="p-3">₹{row.emi?.toLocaleString()}</td>
                                        <td className="p-3 text-green-700">₹{row.principal?.toLocaleString()}</td>
                                        <td className="p-3 text-yellow-700">₹{row.interest?.toLocaleString()}</td>
                                        <td className="p-3 font-semibold">₹{row.balance?.toLocaleString()}</td>
                                        <td className="p-3">
                                            {row.paid ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                    <CheckCircle size={12} /> Paid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                                                    <Clock size={12} /> Due
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {row.paid ? (
                                                row.txHash && (
                                                    <span className="text-xs font-mono text-gray-400" title={row.txHash}>
                                                        <LinkIcon size={12} className="inline mr-1" />
                                                        {row.txHash.slice(0, 10)}...
                                                    </span>
                                                )
                                            ) : (
                                                <button
                                                    onClick={() => handlePayEMI(row.month)}
                                                    disabled={paying}
                                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg
                                                        hover:bg-green-700 transition font-semibold">
                                                    Pay Now
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ label, value, bg, text }) => (
    <div className={`${bg} rounded-2xl p-4 shadow-sm`}>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-xl font-bold ${text}`}>{value}</p>
    </div>
);

export default RepaymentTracking;
