import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminAPI from '../adminApi';
import { Shield, KeyRound, User } from 'lucide-react';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const { adminLogin } = useAdminAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await AdminAPI.post('/auth/login', {
                username,
                password
            });

            // Only allow admin/bank_manager
            if (data.role !== 'admin' && data.role !== 'bank_manager') {
                setError('Access denied. Admin credentials required.');
                setLoading(false);
                return;
            }

            adminLogin(data);
            navigate('/manager/dashboard');

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4
                        bg-gradient-to-br from-green-900 via-green-800 to-green-950">

            <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-xl p-10
                            rounded-2xl shadow-2xl border border-green-100">

                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-2xl flex items-center
                                    justify-center shadow-lg shadow-green-200">
                        <Shield className="h-8 w-8 text-green-700" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Bank Manager Portal
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Smart Agri Loan — Admin Access
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <User size={14} className="inline mr-1" />
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl
                                       focus:ring-2 focus:ring-green-500 focus:outline-none
                                       transition"
                            placeholder="Enter admin username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <KeyRound size={14} className="inline mr-1" />
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl
                                       focus:ring-2 focus:ring-green-500 focus:outline-none
                                       transition"
                            placeholder="Enter admin password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700
                                   text-white rounded-xl font-bold shadow-lg shadow-green-200
                                   hover:from-green-700 hover:to-green-800 transition-all
                                   disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In as Manager'}
                    </button>
                </form>

                <div className="text-center text-xs text-gray-400 mt-4">
                    Authorized personnel only. All actions are audited.
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
