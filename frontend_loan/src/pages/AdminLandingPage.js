import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Building2, Users } from 'lucide-react';

const AdminLandingPage = () => {
    return (
        <div className="bg-white min-h-[calc(100vh-64px)]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-950 z-0"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-32">
                    <div className="text-center max-w-3xl mx-auto text-white">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                                <Building2 className="h-16 w-16 text-yellow-400" />
                            </div>
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight mb-4 animate-fade-in">
                            Bank Manager <br />
                            <span className="text-yellow-400">Administration Portal</span>
                        </h1>
                        <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto animate-slide-up">
                            Secure platform for Bank Managers and Officers to review, approve, and manage agricultural loan applications.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <Link
                                to="/admin/login"
                                className="px-8 py-3.5 rounded-xl bg-white text-green-900 font-bold hover:bg-green-50 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <ShieldCheck size={20} /> Login to Portal
                            </Link>
                            <Link
                                to="/admin/register"
                                className="px-8 py-3.5 rounded-xl bg-yellow-500 text-green-950 font-bold hover:bg-yellow-400 transition-all shadow-lg flex items-center justify-center gap-2 border border-yellow-400"
                            >
                                Register New Official <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Info */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-20 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <ShieldCheck className="text-green-700 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Access</h3>
                        <p className="text-gray-600">Enterprise-grade security ensuring farmer data and financial decisions are protected.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Users className="text-yellow-700 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Applicant Management</h3>
                        <p className="text-gray-600">Review comprehensive farmer profiles, credit scores, and ML-driven risk analyses.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                        <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Building2 className="text-green-700 h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Immutable Blockchain</h3>
                        <p className="text-gray-600">All loan approvals and EMI records are cryptographically secured on the digital ledger.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLandingPage;
