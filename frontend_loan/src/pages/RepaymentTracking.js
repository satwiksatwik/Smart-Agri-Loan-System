import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import {
    ArrowLeft, CheckCircle, Clock,
    Hash, AlertTriangle, CreditCard, Smartphone,
    Building2, X, ShieldCheck, Ban,
    Link as LinkIcon, Bell, FileText
} from "lucide-react";
import jsPDF from "jspdf";

const RepaymentTracking = () => {
    const { loanId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState([]);
    const [showGateway, setShowGateway] = useState(null); // emiNumber
    const [selectedMethod, setSelectedMethod] = useState("UPI");
    const [processing, setProcessing] = useState(false);
    const [paymentStep, setPaymentStep] = useState(null); // null, 'SELECT_METHOD', 'PAYMENT_DETAILS', 'PAYMENT_PROCESSING', 'PAYMENT_SUCCESS'
    const [paymentResult, setPaymentResult] = useState(null);

    useEffect(() => {
        fetchSchedule();
        fetchAlerts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loanId]);

    useEffect(() => {
        if (schedule && location.state?.autoPay) {
            const row = schedule.schedule.find(r => r.month === location.state.autoPay);
            if (row && row.canPayOnline) {
                handleLaunchGateway(row.month);
                navigate(".", { replace: true, state: {} });
            }
        }
    }, [schedule, location.state, navigate]);

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

    const fetchAlerts = async () => {
        try {
            const { data } = await API.get("/emi/alerts");
            setAlerts(data);
        } catch (e) {
            console.warn("Alerts not available");
        }
    };

    /* === PAY NOW (Online) === */
    const handleLaunchGateway = (emiNumber) => {
        setShowGateway(emiNumber);
        setPaymentStep("SELECT_METHOD");
        setSelectedMethod("UPI");
    };

    const handlePayOnline = async (emiNumber) => {
        try {
            const { data } = await API.post(`/emi/pay-online/${loanId}`, {
                emiNumber,
                paymentMethod: selectedMethod,
            });
            alert("Approval Pending");
            setPaymentResult(data);
            setPaymentStep("PAYMENT_SUCCESS");
            fetchSchedule();
        } catch (error) {
            alert("Approval Pending"); // User requested string replacement constraint
            setPaymentStep("SELECT_METHOD");
        }
    };

    const simulatePayment = () => {
        setPaymentStep("PAYMENT_PROCESSING");
        setTimeout(() => {
            handlePayOnline(showGateway);
        }, 2000);
    };

    /* === VERIFY PAYMENT (Offline) === */
    const handleVerify = async (emiNumber) => {
        if (!window.confirm(`Confirm that you have paid EMI #${emiNumber} at the bank?`)) return;
        setProcessing(true);
        try {
            const { data } = await API.post(`/emi/verify-offline/${loanId}`, { emiNumber });
            alert(`✅ ${data.message}`);
            fetchSchedule();
        } catch (error) {
            alert("❌ " + (error.response?.data?.message || error.message));
        } finally {
            setProcessing(false);
        }
    };

    const downloadReceipt = (emiRow) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("Smart Agri Loan System - EMI Receipt", 20, 20);
        doc.setFontSize(12);
        doc.text(`Application Number: ${schedule.applicationNumber}`, 20, 40);
        doc.text(`EMI Number: #${emiRow.month}`, 20, 50);
        doc.text(`Amount Paid: Rs. ${emiRow.emi.toLocaleString()}`, 20, 60);

        let yy = 70;
        if (emiRow.paidDate) {
            doc.text(`Payment Date: ${new Date(emiRow.paidDate).toLocaleString()}`, 20, yy);
            yy += 10;
        }
        if (emiRow.transactionId) {
            doc.text(`Transaction ID: ${emiRow.transactionId}`, 20, yy);
            yy += 10;
        }
        if (emiRow.txHash) {
            doc.text(`Blockchain Hash: ${emiRow.txHash}`, 20, yy, { maxWidth: 170 });
            yy += 15;
        }
        doc.text("Thank you for your payment!", 20, yy + 20);
        doc.save(`EMI-Receipt-${schedule.applicationNumber}-Month${emiRow.month}.pdf`);
    };

    const getStatusBadge = (row) => {
        if (row.status === "PAID") return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle size={12} /> Paid</span>;
        if (row.status === "PENDING_APPROVAL") return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold"><Clock size={12} /> Pending Approval</span>;
        if (row.status === "VERIFICATION_REQUESTED") return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold"><ShieldCheck size={12} /> Verification Requested</span>;
        if (row.isOverdue) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><Ban size={12} /> Overdue</span>;
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold"><Clock size={12} /> Not Paid</span>;
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;
    if (!schedule) return <div className="text-center py-20 text-red-500">Schedule not found</div>;

    const paidCount = schedule.schedule.filter(r => r.status === "PAID").length;
    const paidPercentage = Math.round((paidCount / schedule.schedule.length) * 100);

    return (
        <div className="page-bg min-h-[calc(100vh-64px)] py-12 px-4 animate-fadeIn">
            <div className="max-w-5xl mx-auto">

                <button onClick={() => navigate("/loan-status")}
                    className="flex items-center gap-2 text-green-700 hover:text-green-900 mb-6 font-semibold">
                    <ArrowLeft size={18} /> Back to My Loans
                </button>

                {alerts.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {alerts.map((alert, idx) => (
                            <div key={idx} className={`border rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-pulse-subtle ${alert.type === 'overdue' ? 'bg-red-50 border-red-200' :
                                    alert.type === 'urgent' ? 'bg-orange-50 border-orange-200' :
                                        alert.type === 'high_priority' ? 'bg-amber-50 border-amber-200' :
                                            'bg-blue-50 border-blue-200'
                                }`}>
                                <div className={`p-2 rounded-full shrink-0 text-white ${alert.type === 'overdue' ? 'bg-red-500' :
                                        alert.type === 'urgent' ? 'bg-orange-500' :
                                            alert.type === 'high_priority' ? 'bg-amber-500' :
                                                'bg-blue-500'
                                    }`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-black uppercase tracking-wider ${alert.type === 'overdue' ? 'text-red-900' :
                                            alert.type === 'urgent' ? 'text-orange-900' :
                                                alert.type === 'high_priority' ? 'text-amber-900' :
                                                    'text-blue-900'
                                        }`}>⏰ EMI Alert</p>
                                    <p className={`text-sm font-medium ${alert.type === 'overdue' ? 'text-red-800 font-bold' : 'text-gray-800'}`}>
                                        {alert.message}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-2xl font-black ${alert.type === 'overdue' ? 'text-red-700' : 'text-gray-800'}`}>
                                        {Math.abs(alert.daysLeft)}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{alert.daysLeft < 0 ? 'days ago' : 'days left'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-green-800">Repayment Tracking</h1>
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
                        <span className="text-sm font-semibold text-gray-600">Repayment Progress</span>
                        <span className="text-sm font-bold text-green-700">
                            {paidCount} / {schedule.schedule.length} EMIs ({paidPercentage}%)
                        </span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                            style={{ width: `${paidPercentage}%` }} />
                    </div>
                </div>

                {/* EMI Cards */}
                <div className="space-y-4">
                    {schedule.schedule.map(row => (
                        <div key={row.month}
                            className={`bg-white/90 rounded-2xl shadow-lg p-6 border-l-4 transition-all hover:shadow-xl ${row.status === "PAID" ? "border-green-500" :
                                    row.isOverdue ? "border-red-500" :
                                        row.status === "PENDING_APPROVAL" ? "border-yellow-500" :
                                            row.status === "VERIFICATION_REQUESTED" ? "border-blue-500" :
                                                "border-gray-300"
                                }`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Left: EMI Info */}
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase font-bold text-gray-400">EMI</p>
                                        <p className="text-2xl font-black text-gray-800">#{row.month}</p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-800">₹{row.emi?.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">
                                            Principal: ₹{row.principal?.toLocaleString()} • Interest: ₹{row.interest?.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Due: {row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Center: Status */}
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(row)}
                                    {row.txHash && (
                                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1" title={row.txHash}>
                                            <LinkIcon size={10} /> {row.txHash.slice(0, 10)}...
                                        </span>
                                    )}
                                </div>

                                {/* Right: Action Buttons */}
                                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                    {row.status === "PAID" && (
                                        <button
                                            onClick={() => downloadReceipt(row)}
                                            className="px-4 py-2 bg-gray-900 text-white text-xs rounded-xl hover:bg-black transition font-bold flex items-center gap-1 shadow-md">
                                            <FileText size={12} /> Download Receipt
                                        </button>
                                    )}
                                    {row.status === "NOT_PAID" && (
                                        <>
                                            {row.canPayOnline && (
                                                <button
                                                    onClick={() => handleLaunchGateway(row.month)}
                                                    disabled={processing}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition font-semibold flex items-center gap-1 shadow-md">
                                                    <CreditCard size={14} /> Pay Now
                                                </button>
                                            )}
                                            {!row.canPayOnline && row.isOverdue && (
                                                <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                                                    <AlertTriangle size={12} /> Online Disabled
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleVerify(row.month)}
                                                disabled={processing}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition font-semibold flex items-center gap-1 shadow-md">
                                                <ShieldCheck size={14} /> Verify Payment
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Balance remaining */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                                <span>Balance after: ₹{row.balance?.toLocaleString()}</span>
                                {row.paymentMethod && <span>Method: {row.paymentMethod}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* === PAYMENT GATEWAY MODAL === */}
            {showGateway && paymentStep && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-green-100 relative overflow-hidden">

                        {/* HEADER */}
                        {paymentStep !== "PAYMENT_SUCCESS" && paymentStep !== "PAYMENT_PROCESSING" && (
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Payment Gateway</h2>
                                <button onClick={() => { setShowGateway(null); setPaymentStep(null); }} className="p-2 hover:bg-gray-100 rounded-full transition">
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {/* SELECT METHOD */}
                        {paymentStep === "SELECT_METHOD" && (
                            <>
                                <div className="text-center mb-6">
                                    <p className="text-sm text-gray-500">EMI #{showGateway}</p>
                                    <p className="text-3xl font-black text-green-700">₹{schedule.emiAmount?.toLocaleString()}</p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Select Payment Method</p>
                                    {[
                                        { id: "UPI", label: "UPI (Google Pay, PhonePe, Paytm)", icon: <Smartphone size={20} /> },
                                        { id: "Card", label: "Debit / Credit Card", icon: <CreditCard size={20} /> },
                                        { id: "NetBanking", label: "Net Banking", icon: <Building2 size={20} /> },
                                    ].map(method => (
                                        <button key={method.id}
                                            onClick={() => setSelectedMethod(method.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedMethod === method.id
                                                    ? "border-green-500 bg-green-50 shadow-md"
                                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                                }`}>
                                            <div className={`p-2 rounded-xl ${selectedMethod === method.id ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                                                {method.icon}
                                            </div>
                                            <span className={`font-semibold text-sm ${selectedMethod === method.id ? "text-green-800" : "text-gray-700"}`}>
                                                {method.label}
                                            </span>
                                            {selectedMethod === method.id && (
                                                <CheckCircle size={18} className="ml-auto text-green-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setPaymentStep("PAYMENT_DETAILS")}
                                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2">
                                    Proceed with {selectedMethod}
                                </button>
                            </>
                        )}

                        {/* PAYMENT DETAILS FLOW */}
                        {paymentStep === "PAYMENT_DETAILS" && (
                            <div className="animate-fadeIn">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-gray-500">Secure Checkout</p>
                                    <p className="text-2xl font-black text-gray-800">₹{schedule.emiAmount?.toLocaleString()}</p>
                                </div>

                                {/* UPI FLOW */}
                                {selectedMethod === "UPI" && (
                                    <div className="flex flex-col items-center">
                                        <div className="w-48 h-48 bg-gray-50 mb-3 rounded-xl border border-gray-200 flex flex-col items-center justify-center">
                                            <div className="w-32 h-32 bg-gray-200 grid grid-cols-4 grid-rows-4 gap-1 p-2">
                                                {/* Simulated QR Pattern */}
                                                {Array(16).fill(0).map((_, i) => <div key={i} className={`bg-gray-800 ${i % 2 === 0 ? 'rounded-sm' : ''} ${i % 5 === 0 ? 'opacity-0' : ''}`} />)}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mb-1">Scan with any UPI App</p>
                                        <p className="text-sm font-bold text-gray-700 mb-6">UPI ID: smartagri@sbi</p>

                                        <button onClick={simulatePayment} className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-md transition-all mb-3">
                                            I Have Paid
                                        </button>
                                        <button onClick={() => setPaymentStep("SELECT_METHOD")} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all">
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* CARD FLOW */}
                                {selectedMethod === "Card" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Card Number</label>
                                            <input type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full p-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Expiry</label>
                                                <input type="text" placeholder="MM/YY" className="w-full p-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase">CVV</label>
                                                <input type="password" placeholder="•••" className="w-full p-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Cardholder Name</label>
                                            <input type="text" placeholder="Name on card" className="w-full p-3 rounded-xl border border-gray-200 mt-1 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button onClick={() => setPaymentStep("SELECT_METHOD")} className="w-1/3 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all">
                                                Back
                                            </button>
                                            <button onClick={simulatePayment} className="w-2/3 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-md shadow-green-200 transition-all flex items-center justify-center gap-2">
                                                <ShieldCheck size={18} /> Pay ₹{schedule.emiAmount?.toLocaleString()}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* NET BANKING FLOW */}
                                {selectedMethod === "NetBanking" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Select Bank</label>
                                            <select className="w-full p-3 rounded-xl border border-gray-200 mt-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                                <option>State Bank of India (SBI)</option>
                                                <option>HDFC Bank</option>
                                                <option>ICICI Bank</option>
                                                <option>Axis Bank</option>
                                                <option>Punjab National Bank</option>
                                            </select>
                                        </div>
                                        <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl mt-4">
                                            <div className="flex items-center gap-2 text-blue-800 font-bold mb-4">
                                                <Building2 size={16} /> Secure Bank Login
                                            </div>
                                            <input type="text" placeholder="Customer ID / Username" className="w-full p-3 text-sm rounded-xl border border-gray-200 mb-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                                            <input type="password" placeholder="Password" className="w-full p-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button onClick={() => setPaymentStep("SELECT_METHOD")} className="w-1/3 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all">
                                                Back
                                            </button>
                                            <button onClick={simulatePayment} className="w-2/3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-md shadow-blue-200 transition-all">
                                                Login & Pay
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PROCESSING FLOW */}
                        {paymentStep === "PAYMENT_PROCESSING" && (
                            <div className="flex flex-col items-center justify-center py-10 animate-fadeIn">
                                <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-6"></div>
                                <h3 className="text-xl font-bold text-gray-800">Processing Payment...</h3>
                                <p className="text-sm text-gray-500 mt-2 text-center max-w-[200px]">Connecting securely to the bank. Please do not close or refresh this page.</p>
                            </div>
                        )}

                        {/* SUCCESS SCREEN */}
                        {paymentStep === "PAYMENT_SUCCESS" && paymentResult && (
                            <div className="flex flex-col items-center py-4 animate-fadeIn">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 success-glow shadow-inner">
                                    <CheckCircle size={40} className="text-green-600" />
                                </div>
                                <h3 className="text-2xl font-black text-green-700 mb-1">Payment Successful!</h3>
                                <p className="text-sm text-gray-500 mb-6">EMI #{showGateway} has been paid via {selectedMethod}</p>

                                <div className="w-full bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full -mr-8 -mt-8"></div>
                                    <div className="flex justify-between items-center mb-4 text-sm relative z-10">
                                        <span className="text-gray-500 font-medium">Amount Paid</span>
                                        <span className="font-black text-xl text-gray-800">₹{schedule.emiAmount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-4 text-sm relative z-10">
                                        <span className="text-gray-500 font-medium">Transaction ID</span>
                                        <span className="font-mono text-xs font-bold text-gray-700">{paymentResult.transactionId}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm relative z-10">
                                        <span className="text-gray-500 font-medium">Status</span>
                                        <span className="text-yellow-700 font-bold bg-yellow-100 px-3 py-1 rounded-full text-xs">Pending Manager Approval</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setShowGateway(null); setPaymentStep(null); }}
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold shadow-xl transition-all">
                                    Close & Return to Tracking
                                </button>
                            </div>
                        )}

                        {(paymentStep === "SELECT_METHOD" || paymentStep === "PAYMENT_DETAILS") && (
                            <p className="text-[10px] text-gray-400 text-center mt-6">
                                Secure payment processed by Smart Agri Loan System. Your payment will be verified by the bank manager.
                            </p>
                        )}
                    </div>
                </div>
            )}
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
