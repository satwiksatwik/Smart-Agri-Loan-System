import React, { useState } from "react";
import API from "../api";
import {
    Calculator, IndianRupee, TrendingUp, Calendar
} from "lucide-react";

const EMICalculator = () => {
    const [formData, setFormData] = useState({
        amount: "",
        rate: "8.5",
        tenure: "12",
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCalculate = async () => {
        if (!formData.amount || !formData.rate || !formData.tenure) {
            alert("Please fill all fields");
            return;
        }
        setLoading(true);
        try {
            const { data } = await API.post("/emi/calculate", formData);
            setResult(data);
        } catch (error) {
            alert("Calculation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-bg min-h-[calc(100vh-64px)] py-12 px-4 animate-fadeIn">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-green-800 flex justify-center items-center gap-2">
                        <Calculator /> EMI Calculator
                    </h1>
                    <p className="text-gray-600 mt-2">Calculate your monthly loan EMI</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Input Card */}
                    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                        <h2 className="text-lg font-bold mb-6 text-green-700">Enter Loan Details</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <IndianRupee size={14} className="inline mr-1" />
                                    Loan Amount (₹)
                                </label>
                                <input type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    placeholder="e.g., 500000" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <TrendingUp size={14} className="inline mr-1" />
                                    Interest Rate (% per annum)
                                </label>
                                <input type="number" step="0.1"
                                    value={formData.rate}
                                    onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Calendar size={14} className="inline mr-1" />
                                    Tenure (months)
                                </label>
                                <input type="number"
                                    value={formData.tenure}
                                    onChange={e => setFormData({ ...formData, tenure: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none" />
                            </div>

                            <button onClick={handleCalculate} disabled={loading}
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold
                                    hover:bg-green-700 transition shadow-lg shadow-green-200">
                                {loading ? "Calculating..." : "Calculate EMI"}
                            </button>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                        <h2 className="text-lg font-bold mb-6 text-green-700">EMI Summary</h2>

                        {result ? (
                            <div className="space-y-4">
                                <ResultBox label="Monthly EMI" value={`₹${result.emi?.toLocaleString()}`} color="text-green-700" bg="bg-green-50" />
                                <ResultBox label="Total Interest" value={`₹${result.totalInterest?.toLocaleString()}`} color="text-yellow-700" bg="bg-yellow-50" />
                                <ResultBox label="Total Payment" value={`₹${result.totalPayment?.toLocaleString()}`} color="text-blue-700" bg="bg-blue-50" />
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-400">
                                <Calculator size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Enter values and click Calculate</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Amortization Schedule */}
                {result?.schedule && (
                    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mt-6">
                        <h2 className="text-lg font-bold mb-4 text-green-700">Amortization Schedule</h2>
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr className="text-gray-500">
                                        <th className="p-3">Month</th>
                                        <th className="p-3">EMI</th>
                                        <th className="p-3">Principal</th>
                                        <th className="p-3">Interest</th>
                                        <th className="p-3">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.schedule.map(row => (
                                        <tr key={row.month} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-mono">{row.month}</td>
                                            <td className="p-3">₹{row.emi?.toLocaleString()}</td>
                                            <td className="p-3 text-green-700">₹{row.principal?.toLocaleString()}</td>
                                            <td className="p-3 text-yellow-700">₹{row.interest?.toLocaleString()}</td>
                                            <td className="p-3 font-semibold">₹{row.balance?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ResultBox = ({ label, value, color, bg }) => (
    <div className={`${bg} rounded-xl p-4`}>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

export default EMICalculator;
