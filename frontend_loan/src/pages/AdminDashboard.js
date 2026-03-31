import React, { useEffect, useState } from "react";
import AdminAPI from "../adminApi";
import { Link as LinkIcon, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const AdminDashboard = () => {
    const [summary, setSummary] = useState({
        totalLoans: 0,
        approvedLoans: 0,
        rejectedLoans: 0,
        pendingLoans: 0,
        totalApprovedAmount: 0,
    });

    const [loans, setLoans] = useState([]);
    const [blockchainTxs, setBlockchainTxs] = useState([]);
    const [blockchainStatus, setBlockchainStatus] = useState({
        connected: false,
        transactionCount: 0,
        loanCount: 0,
    });
    const [blockchainError, setBlockchainError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setRefreshing(true);
        setBlockchainError("");

        try {
            const [summaryRes, loansRes] = await Promise.all([
                AdminAPI.get("/admin/analytics"),
                AdminAPI.get("/admin/loans"),
            ]);

            setSummary(summaryRes.data);
            setLoans(loansRes.data);
        } catch (error) {
            console.error("Admin fetch error:", error);
        }

        // Fetch blockchain data separately so loan data still shows even if blockchain fails
        try {
            const [txRes, statusRes] = await Promise.all([
                AdminAPI.get("/admin/blockchain/transactions"),
                AdminAPI.get("/admin/blockchain/status"),
            ]);
            setBlockchainTxs(txRes.data);
            setBlockchainStatus(statusRes.data);
            setBlockchainError("");
        } catch (e) {
            console.warn("Blockchain data fetch error:", e);
            setBlockchainError(
                e.response?.data?.message || "Could not connect to blockchain service"
            );
        }

        setRefreshing(false);
    };

    /* ================= RISK DISTRIBUTION ================= */

    const riskCount = (type) => {
        if (type === "high")
            return loans.filter((l) => l.creditScore < 600).length;

        if (type === "medium")
            return loans.filter(
                (l) => l.creditScore >= 600 && l.creditScore <= 750
            ).length;

        if (type === "low")
            return loans.filter((l) => l.creditScore > 750).length;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button
                    onClick={fetchData}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
                               hover:bg-indigo-700 transition disabled:opacity-50"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* ================= TOP CARDS ================= */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

                {/* TOTAL LOANS */}
                <div className="bg-white shadow rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm">TOTAL LOANS</h3>
                    <h2 className="text-3xl font-bold">{summary.totalLoans}</h2>
                    <p className="text-green-600 text-sm">Approved: {summary.approvedLoans}</p>
                    <p className="text-red-600 text-sm">Rejected: {summary.rejectedLoans}</p>
                    <p className="text-yellow-600 text-sm">Pending: {summary.pendingLoans}</p>
                </div>

                {/* TOTAL APPROVED AMOUNT */}
                <div className="bg-white shadow rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm">TOTAL APPROVED AMOUNT</h3>
                    <h2 className="text-3xl font-bold">₹{summary.totalApprovedAmount?.toLocaleString()}</h2>
                    <p className="text-gray-500 text-sm">Disbursed to farmers</p>
                </div>

                {/* RISK DISTRIBUTION */}
                <div className="bg-white shadow rounded-xl p-6">
                    <h3 className="text-gray-500 text-sm">RISK DISTRIBUTION</h3>
                    <div className="flex justify-between mt-4">
                        <div className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-center">
                            <p className="text-lg font-bold">{riskCount("high")}</p>
                            <p className="text-xs">High (&lt;600)</p>
                        </div>
                        <div className="bg-yellow-100 text-yellow-600 px-4 py-2 rounded-lg text-center">
                            <p className="text-lg font-bold">{riskCount("medium")}</p>
                            <p className="text-xs">Medium (600–750)</p>
                        </div>
                        <div className="bg-green-100 text-green-600 px-4 py-2 rounded-lg text-center">
                            <p className="text-lg font-bold">{riskCount("low")}</p>
                            <p className="text-xs">Low (&gt;750)</p>
                        </div>
                    </div>
                </div>

                {/* BLOCKCHAIN STATUS */}
                <div className={`shadow rounded-xl p-6 ${blockchainStatus.connected ? 'bg-indigo-50' : 'bg-red-50'}`}>
                    <h3 className="text-gray-500 text-sm flex items-center gap-1">
                        <LinkIcon size={14} /> BLOCKCHAIN
                    </h3>
                    <h2 className="text-3xl font-bold text-indigo-700">
                        {blockchainStatus.transactionCount || blockchainTxs.length}
                    </h2>
                    <p className="text-gray-500 text-sm">On-chain transactions</p>
                    <div className="flex items-center gap-1 mt-2">
                        {blockchainStatus.connected ? (
                            <>
                                <CheckCircle size={14} className="text-green-600" />
                                <span className="text-xs text-green-600 font-medium">Connected</span>
                            </>
                        ) : (
                            <>
                                <XCircle size={14} className="text-red-500" />
                                <span className="text-xs text-red-500 font-medium">Disconnected</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= RECENT APPLICATIONS TABLE ================= */}
            <div className="bg-white shadow rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b">
                            <tr className="text-gray-500 text-sm">
                                <th className="p-3">Applicant</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Credit Score</th>
                                <th className="p-3">Approved Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Blockchain ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-6 text-gray-500">
                                        No loan applications found.
                                    </td>
                                </tr>
                            ) : (
                                loans.map((loan) => (
                                    <tr key={loan._id} className="border-b hover:bg-gray-50">
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
                                            {loan.blockchainLoanId ? (
                                                <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                                                    #{loan.blockchainLoanId}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= BLOCKCHAIN TRANSACTIONS ================= */}
            <div className="bg-white shadow rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <LinkIcon size={20} /> Blockchain Transactions
                    </h2>
                    {blockchainStatus.connected && (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                            {blockchainStatus.loanCount} loans on-chain
                        </span>
                    )}
                </div>

                {/* Blockchain Error Banner */}
                {blockchainError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg mb-4
                                    flex items-center gap-2 text-sm">
                        <AlertTriangle size={16} />
                        <span>
                            {blockchainError} — Make sure the Hardhat node is running
                            (<code className="bg-amber-100 px-1 rounded">npx hardhat node</code>)
                            and the contract is deployed.
                        </span>
                    </div>
                )}

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
                                        {blockchainError
                                            ? "Cannot load blockchain transactions."
                                            : "No blockchain transactions yet."}
                                    </td>
                                </tr>
                            ) : (
                                blockchainTxs.map((tx, idx) => (
                                    <tr key={idx} className="border-b hover:bg-gray-50">
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

export default AdminDashboard;
