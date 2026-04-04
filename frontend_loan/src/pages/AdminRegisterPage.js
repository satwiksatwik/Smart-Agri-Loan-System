import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Phone, Briefcase, MapPin, KeyRound, ArrowRight } from 'lucide-react';
import AdminAPI from '../adminApi';

function AdminRegisterPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        mobile: '',
        employeeId: '',
        bankName: '',
        branchName: '',
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await AdminAPI.post('/auth/admin/register', formData);

            // Successfully registered, navigate to admin login
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side - Welcome text */}
                <div className="bg-green-700 p-10 text-white md:w-2/5 flex flex-col justify-center">
                    <Building2 size={48} className="mb-6 opacity-80" />
                    <h2 className="text-3xl font-bold mb-4">Manager<br/>Portal</h2>
                    <p className="text-green-100 text-sm leading-relaxed mb-8">
                        Register a new bank employee account to manage agricultural loan applications, oversee EMI approvals, and track regional analytics.
                    </p>
                    <div className="mt-auto">
                        <p className="text-xs text-green-200">Already have an account?</p>
                        <Link to="/admin" className="inline-flex items-center gap-2 mt-2 font-semibold text-white hover:text-green-200 transition">
                            Login here <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 md:p-10 md:w-3/5">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h3>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                                <div className="mt-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
                                    <User size={16} className="text-gray-400 mr-2" />
                                    <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="bg-transparent w-full outline-none text-sm" placeholder="John Doe" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                                <div className="mt-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
                                    <Phone size={16} className="text-gray-400 mr-2" />
                                    <input required type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="bg-transparent w-full outline-none text-sm" placeholder="9876543210" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Bank Name</label>
                                <div className="mt-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
                                    <Building2 size={16} className="text-gray-400 mr-2" />
                                    <input required type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="bg-transparent w-full outline-none text-sm" placeholder="State Bank of India" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Branch</label>
                                <div className="mt-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
                                    <MapPin size={16} className="text-gray-400 mr-2" />
                                    <input required type="text" name="branchName" value={formData.branchName} onChange={handleChange} className="bg-transparent w-full outline-none text-sm" placeholder="Downtown Hub" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Employee ID</label>
                            <div className="mt-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
                                <Briefcase size={16} className="text-gray-400 mr-2" />
                                <input required type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} className="bg-transparent w-full outline-none text-sm" placeholder="EMP-10293" />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Username</label>
                                <div className="mt-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
                                    <User size={16} className="text-gray-400 mr-2" />
                                    <input required type="text" name="username" value={formData.username} onChange={handleChange} className="bg-transparent w-full outline-none text-sm" placeholder="admin_john" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
                                <div className="mt-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
                                    <KeyRound size={16} className="text-gray-400 mr-2" />
                                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="bg-transparent w-full outline-none text-sm" placeholder="••••••••" />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                            {isLoading ? 'Registering...' : 'Register as Manager'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminRegisterPage;
