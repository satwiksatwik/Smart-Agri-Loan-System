import React, { useState, useEffect } from 'react';
import API from '../api';
import {
    User, Phone, Mail, Shield, Calendar,
    Edit2, Lock, CheckCircle, AlertCircle
} from 'lucide-react';

const ProfilePage = () => {

    const [user, setUser] = useState(null);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchProfile = async () => {
        try {
            const { data } = await API.get('/auth/profile');
            setUser(data.user || {});
            setLoans(data.loans || []);
        } catch (error) {
            console.error("Profile fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-64px)]">
                <div className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">

            {message.text && (
                <div className={`p-4 rounded-lg flex items-center ${message.type === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                    {message.type === 'error'
                        ? <AlertCircle className="mr-2" />
                        : <CheckCircle className="mr-2" />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex flex-col items-center">

                        <div className="h-32 w-32 rounded-full bg-green-100 flex items-center justify-center text-4xl font-bold text-green-700">
                            {user?.username?.charAt(0)?.toUpperCase() || <User />}
                        </div>

                        <h2 className="mt-4 text-2xl font-bold">
                            {user?.username || "User"}
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            {user?.role || "user"}
                        </p>

                        <div className="mt-6 space-y-2 text-sm text-gray-600">
                            <div><Mail className="inline mr-2" /> {user?.email}</div>
                            <div><Phone className="inline mr-2" /> {user?.mobile || "Not provided"}</div>
                            <div>
                                <Calendar className="inline mr-2" />
                                Joined {user?.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString()
                                    : "—"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loan History */}
                <div className="bg-white rounded-2xl shadow p-6 lg:col-span-2">
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                        <Shield className="mr-2 text-green-600" /> Loan History
                    </h3>

                    {loans.length === 0 ? (
                        <p className="text-gray-500">No loans applied yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-2">Date</th>
                                        <th>Purpose</th>
                                        <th>Loan Type</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map((loan) => {

                                        const displayAmount =
                                            loan.status === "Approved"
                                                ? loan.approvedAmount
                                                : loan.loanAmount;

                                        return (
                                            <tr key={loan._id} className="border-b hover:bg-gray-50">
                                                <td className="py-3">
                                                    {loan?.createdAt
                                                        ? new Date(loan.createdAt).toLocaleDateString()
                                                        : "—"}
                                                </td>

                                                <td>{loan?.purpose || "—"}</td>

                                                <td>{loan?.loanType || "—"}</td>

                                                <td className="font-semibold">
                                                    ₹{Number(displayAmount || 0).toLocaleString()}
                                                </td>

                                                <td>
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${loan.status === "Approved"
                                                            ? "bg-green-100 text-green-700"
                                                            : loan.status === "Rejected"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
