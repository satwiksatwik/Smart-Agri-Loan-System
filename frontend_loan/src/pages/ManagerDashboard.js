import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminAPI from "../adminApi";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import {
    Users, CheckCircle, XCircle, Clock, IndianRupee,
    Link as LinkIcon, Eye, Shield
} from "lucide-react";

const COLORS = ["#16a34a", "#dc2626", "#eab308", "#3b82f6", "#8b5cf6"];

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState(null);
    const [loans, setLoans] = useState([]);
    const [filter, setFilter] = useState("all");
    const [blockchainTxs, setBlockchainTxs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dashRes, loansRes] = await Promise.all([
                AdminAPI.get("/manager/dashboard"),
                AdminAPI.get("/manager/loans"),
            ]);
            setDashboard(dashRes.data);
            setLoans(loansRes.data);

            // Fetch blockchain transactions
            try {
                const txRes = await AdminAPI.get("/manager/blockchain/transactions");
                setBlockchainTxs(txRes.data);
            } catch (e) {
                console.warn("Blockchain transactions not available");
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLoans = filter === "all"
        ? loans
        : loans.filter(l => l.status === filter);

    if (loading) return <div className="text-center py-20">Loading Dashboard...</div>;

    const riskData = dashboard?.riskDistribution?.map(r => ({
        name: r._id,
        value: r.count,
    })) || [];

    const loanTypeData = dashboard?.loanTypeDistribution?.map(r => ({
        name: r._id?.replace(/_/g, " ") || "Unknown",
        count: r.count,
    })) || [];

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
            <h1 className="text-3xl font-bold mb-2 text-green-800 flex items-center gap-2">
                <Shield /> Bank Manager Dashboard
            </h1>
            <p className="text-gray-500 mb-8">Loan Management & Analytics</p>

            {/* ================= STAT CARDS ================= */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard icon={<Users />} label="Total Requests" value={dashboard?.totalLoans || 0} bg="bg-blue-50" text="text-blue-700" />
                <StatCard icon={<Clock />} label="Pending" value={dashboard?.pendingLoans || 0} bg="bg-yellow-50" text="text-yellow-700" />
                <StatCard icon={<CheckCircle />} label="Approved" value={dashboard?.approvedLoans || 0} bg="bg-green-50" text="text-green-700" />
                <StatCard icon={<XCircle />} label="Rejected" value={dashboard?.rejectedLoans || 0} bg="bg-red-50" text="text-red-700" />
                <StatCard icon={<IndianRupee />} label="Disbursed" value={`₹${(dashboard?.totalApprovedAmount || 0).toLocaleString()}`} bg="bg-purple-50" text="text-purple-700" />
                <StatCard icon={<LinkIcon />} label="Blockchain Tx" value={dashboard?.blockchainTxCount || 0} bg="bg-indigo-50" text="text-indigo-700" />
            </div>

            {/* ================= CHARTS ================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Risk Distribution Pie */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
                    {riskData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                                    {riskData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-gray-400 text-center py-10">No data yet</p>}
                </div>

                {/* Loan Type Distribution Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Loan Type Distribution</h3>
                    {loanTypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={loanTypeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#16a34a" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-gray-400 text-center py-10">No data yet</p>}
                </div>
            </div>

            {/* ================= FILTER TABS ================= */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Loan Applications</h2>
                    <div className="flex gap-2">
                        {["all", "Pending", "Approved", "Rejected"].map(f => (
                            <button key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
                                    ${filter === f
                                        ? "bg-green-600 text-white shadow"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                {f === "all" ? "All" : f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ================= LOANS TABLE ================= */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b bg-gray-50">
                            <tr className="text-gray-500 text-sm">
                                <th className="p-3">App No</th>
                                <th className="p-3">Applicant</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Credit Score</th>
                                <th className="p-3">Risk</th>
                                <th className="p-3">ML Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLoans.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-gray-400">
                                        No applications found
                                    </td>
                                </tr>
                            ) : (
                                filteredLoans.map(loan => (
                                    <tr key={loan._id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-mono text-sm">{loan.applicationNumber}</td>
                                        <td className="p-3 font-semibold">{loan.fullName}</td>
                                        <td className="p-3">₹{loan.loanAmount?.toLocaleString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold
                                                ${loan.creditScore >= 750 ? "bg-green-100 text-green-700"
                                                    : loan.creditScore >= 600 ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-red-100 text-red-700"}`}>
                                                {loan.creditScore}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold
                                                ${loan.riskLevel === "Low" ? "bg-green-100 text-green-700"
                                                    : loan.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-700"
                                                        : loan.riskLevel === "High" ? "bg-red-100 text-red-700"
                                                            : "bg-gray-100 text-gray-500"}`}>
                                                {loan.riskLevel || "N/A"}
                                            </span>
                                        </td>
                                        <td className="p-3">₹{loan.approvedAmount?.toLocaleString()}</td>
                                        <td className="p-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold
                                                ${loan.status === "Approved" ? "bg-green-100 text-green-700"
                                                    : loan.status === "Rejected" ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"}`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => navigate(`/manager/loan/${loan._id}`)}
                                                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm
                                                    hover:bg-green-700 transition flex items-center gap-1">
                                                <Eye size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= BLOCKCHAIN TRANSACTIONS ================= */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <LinkIcon size={20} /> Blockchain Transactions
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b bg-gray-50">
                            <tr className="text-gray-500 text-sm">
                                <th className="p-3">Loan ID</th>
                                <th className="p-3">Action</th>
                                <th className="p-3">Details</th>
                                <th className="p-3">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blockchainTxs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-400">
                                        No blockchain transactions yet. Apply for a loan to create on-chain records.
                                    </td>
                                </tr>
                            ) : (
                                blockchainTxs.map((tx, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="p-3 font-mono">#{tx.loanId}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold
                                                ${tx.action === "APPROVED" ? "bg-green-100 text-green-700"
                                                    : tx.action === "REJECTED" ? "bg-red-100 text-red-700"
                                                        : tx.action === "EMI_PAID" ? "bg-blue-100 text-blue-700"
                                                            : tx.action === "CREATED" ? "bg-teal-100 text-teal-700"
                                                                : "bg-gray-100 text-gray-700"}`}>
                                                {tx.action}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm text-gray-600">{tx.details}</td>
                                        <td className="p-3 text-sm">{new Date(tx.timestamp * 1000).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, bg, text }) => (
    <div className={`${bg} rounded-2xl p-4 shadow-sm`}>
        <div className={`${text} mb-2`}>{icon}</div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-2xl font-bold ${text}`}>{value}</p>
    </div>
);

export default ManagerDashboard;
