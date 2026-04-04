import React, { useEffect, useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";
import {
    IndianRupee, AlertTriangle, CheckCircle, Clock,
    ArrowLeft, Hash, CreditCard, PieChart, Activity,
    ShieldCheck, Search, Download
} from "lucide-react";
import jsPDF from "jspdf";

const LoanStatus = () => {
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [schedules, setSchedules] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All"); // All, Active, Completed, Pending

    const [stats, setStats] = useState({
        totalActive: 0,
        dueThisMonth: 0,
        overallAmount: 0
    });

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const { data: userLoans } = await API.get("/loan/my-loans");
                userLoans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setLoans(userLoans);

                const activeLoansCount = userLoans.filter(l => !["Completed", "COMPLETED", "Rejected", "REJECTED"].includes(l.status)).length;
                let activeSum = activeLoansCount;
                
                let dueThisMonthSum = 0;
                let overallSum = 0;
                const newSchedules = {};

                const approvedLoans = userLoans.filter(l => l.status === "Approved");

                await Promise.all(
                    approvedLoans.map(async (loan) => {
                        try {
                            const { data: schedData } = await API.get(`/emi/schedule/${loan._id}`);
                            newSchedules[loan._id] = schedData;
                            
                            overallSum += (schedData.outstanding || 0);

                            const nextEmi = schedData.schedule.find(r => r.status === "NOT_PAID");
                            if (nextEmi) {
                                dueThisMonthSum += (nextEmi.emi || loan.emiAmount || 0);
                            }
                        } catch (err) {
                            console.warn("Failed fetching schedule for", loan._id);
                        }
                    })
                );

                setSchedules(newSchedules);
                setStats({
                    totalActive: activeSum,
                    dueThisMonth: dueThisMonthSum,
                    overallAmount: overallSum
                });
            } catch (error) {
                console.error("Failed to fetch loans", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const getLoanHealth = (scheduleData) => {
        if (!scheduleData) return { label: "Unknown", color: "text-gray-500", bg: "bg-gray-100" };
        const hasOverdue = scheduleData.schedule.some(r => r.isOverdue);
        if (hasOverdue) return { label: "Risky", color: "text-red-700", bg: "bg-red-100" };
        
        // Moderate if paid late manually (checking paidDate > dueDate ideally, we'll approximate)
        // For now, if no overdue but some are PAID we assume Good. 
        return { label: "Good", color: "text-green-700", bg: "bg-green-100" };
    };

    const getPriority = (scheduleData) => {
        if (!scheduleData) return null;
        const now = new Date().getTime();
        let prio = { label: "On Track", icon: <CheckCircle size={14} />, color: "text-green-700", bg: "bg-green-100" };
        
        scheduleData.schedule.forEach(rep => {
            if (rep.status !== "PAID" && rep.dueDate) {
                const dd = new Date(rep.dueDate).getTime();
                if (dd < now || rep.isOverdue) prio = { label: "Overdue", icon: <AlertTriangle size={14} />, color: "text-red-700", bg: "bg-red-100" };
                else if (prio.label !== "Overdue" && dd - now <= 7 * 24 * 60 * 60 * 1000) {
                    prio = { label: "Due Soon", icon: <Clock size={14} />, color: "text-yellow-700", bg: "bg-yellow-100" };
                }
            }
        });
        return prio;
    };

    const downloadLoanPDF = (loan) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Smart Agri Loan System - Application Details", 20, 20);
        
        doc.setFontSize(12);
        let y = 40;
        doc.text(`Application Number: ${loan.applicationNumber}`, 20, y); y+=10;
        doc.text(`Status: ${loan.status}`, 20, y); y+=10;
        doc.text(`Full Name: ${loan.fullName}`, 20, y); y+=10;
        doc.text(`Mobile: ${loan.mobile}`, 20, y); y+=10;
        doc.text(`Loan Type: ${loan.loanType}`, 20, y); y+=10;
        doc.text(`Purpose: ${loan.purpose}`, 20, y); y+=10;
        doc.text(`Requested Amount: Rs. ${Number(loan.loanAmount).toLocaleString()}`, 20, y); y+=10;
        
        if (loan.approvedAmount && loan.status === "Approved") {
            doc.text(`Approved Amount: Rs. ${Number(loan.approvedAmount).toLocaleString()}`, 20, y); y+=10;
        }
        if (loan.rejectionReason && loan.status === "Rejected") {
            doc.text(`Rejection Reason: ${loan.rejectionReason}`, 20, y); y+=10;
        }
        
        doc.save(`Loan-Application-${loan.applicationNumber}.pdf`);
    };

    if (loading) return <div className="text-center py-20 text-gray-500 font-bold">Loading My Loans Dashboard...</div>;

    const filteredLoans = loans.filter(l => {
        const matchSearch = String(l.applicationNumber).toLowerCase().includes(search.toLowerCase());
        let matchFilter = true;
        if (filter === "Active") matchFilter = ["Pending", "Approved"].includes(l.status);
        if (filter === "Completed") matchFilter = ["Completed", "COMPLETED"].includes(l.status);
        return matchSearch && matchFilter;
    });

    return (
        <div className="page-bg min-h-[calc(100vh-64px)] py-10 px-4 animate-fadeIn">
            <div className="max-w-7xl mx-auto">

                <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 font-bold">
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                {/* SMART DASHBOARD (TOP SECTION) */}
                <div className="bg-gradient-to-br from-[#064E3B] to-[#065F46] rounded-3xl p-8 mb-10 shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                    
                    <h1 className="text-3xl font-black mb-6 flex items-center gap-3">
                        <PieChart size={28} className="text-[#A3E635]" /> My Loans Dashboard
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-md">
                            <p className="text-green-200 text-xs font-bold uppercase tracking-wider mb-1">Active Loans</p>
                            <p className="text-3xl font-black text-white">{stats.totalActive}</p>
                        </div>
                        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-md">
                            <p className="text-yellow-200 text-xs font-bold uppercase tracking-wider mb-1">Due This Month</p>
                            <p className="text-3xl font-black text-white flex items-center gap-1">
                                <IndianRupee size={20} />{stats.dueThisMonth.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-md">
                            <p className="text-red-200 text-xs font-bold uppercase tracking-wider mb-1">Overall Due</p>
                            <p className="text-3xl font-black text-white flex items-center gap-1">
                                <IndianRupee size={20} />{stats.overallAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FILTERS AND SEARCH */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="flex bg-white rounded-xl shadow-sm p-1">
                        {["All", "Active", "Completed"].map(lbl => (
                            <button key={lbl} onClick={() => setFilter(lbl)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === lbl ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
                                {lbl} Loans
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                        <input type="text" placeholder="Search Loan ID..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-white border-0 shadow-sm rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium" />
                    </div>
                </div>

                {/* LOAN LIST */}
                {filteredLoans.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <Activity className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-bold">No loans found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredLoans.map(loan => {
                            const schedData = schedules[loan._id];
                            const health = getLoanHealth(schedData);
                            const prio = getPriority(schedData);
                            const isApproved = loan.status === "Approved";
                            const isCompleted = ["Completed", "COMPLETED"].includes(loan.status);

                            return (
                                <div key={loan._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase mb-2 ${
                                                isCompleted ? 'bg-blue-100 text-blue-700' :
                                                isApproved ? 'bg-green-100 text-green-700' :
                                                loan.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {loan.status}
                                            </span>
                                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-1">
                                                <Hash size={16} className="text-gray-400" /> {loan.applicationNumber}
                                            </h3>
                                        </div>
                                        
                                        {isApproved && !isCompleted && prio && (
                                            <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold ${prio.bg} ${prio.color}`}>
                                                {prio.icon} {prio.label}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Amount</p>
                                            <p className="text-emerald-700 font-black text-xl">₹{Number(loan.approvedAmount || loan.loanAmount).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Remaining EMIs</p>
                                            <p className="text-gray-800 font-black text-xl">
                                                {schedData ? (schedData.schedule.length - schedData.paidCount) : (isCompleted ? '0' : loan.tenure)}
                                            </p>
                                        </div>
                                    </div>

                                    {isApproved && !isCompleted && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 flex-wrap gap-4">
                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                                <ShieldCheck size={16} /> Health:
                                                <span className={`font-bold ${health.color}`}>{health.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => {
                                                    const nextEmi = schedData?.schedule.find(r => r.status === "NOT_PAID");
                                                    navigate(`/loan/${loan._id}`, { state: { autoPay: nextEmi?.month } });
                                                }} className="px-5 py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                                                    <CreditCard size={16} /> Pay Next EMI
                                                </button>
                                                <Link to={`/loan/${loan._id}`} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md shadow-green-200 transition-all flex items-center gap-2">
                                                    View <ArrowLeft size={16} className="rotate-180" />
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                            <Link to={`/loan/${loan._id}`} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2">
                                                View History <ArrowLeft size={16} className="rotate-180" />
                                            </Link>
                                        </div>
                                    )}

                                    {loan.status === "Pending" && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-xs text-yellow-600 font-bold flex items-center gap-2">
                                                <Clock size={16} /> Under review by Bank Manager
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button onClick={() => downloadLoanPDF(loan)} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm transition-all">
                                            <Download size={16} /> Download Application PDF
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoanStatus;