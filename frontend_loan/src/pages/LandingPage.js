import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ArrowRight, ShieldCheck, Tractor } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="bg-white min-h-[calc(100vh-64px)]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-agri-light to-white z-0"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-32">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="flex justify-center mb-6">
                            <div className="p-3 bg-agri-light rounded-full">
                                <Sprout className="h-12 w-12 text-agri-primary" />
                            </div>
                        </div>
                        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4 animate-fade-in">
                            Smart Agriculture <br />
                            <span className="text-agri-primary">Loan Portal</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up">
                            AI Powered Agriculture Loan Approval System designed to empower farmers with quick, transparent, and hassle-free financial support.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <Link
                                to="/login"
                                className="px-8 py-3.5 rounded-xl bg-white text-agri-primary font-bold border-2 border-agri-primary hover:bg-agri-light transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-8 py-3.5 rounded-xl bg-agri-primary text-white font-bold hover:bg-agri-dark transition-all shadow-lg hover:shadow-xl shadow-agri-primary/30 flex items-center justify-center gap-2"
                            >
                                Register Now <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid (Optional Visual Polish) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-20 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="bg-agri-light w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <ShieldCheck className="text-agri-primary h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Approval</h3>
                        <p className="text-gray-600">AI-driven analysis ensures your loan application is processed in record time.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="bg-agri-light w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Tractor className="text-agri-primary h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Farmer Focused</h3>
                        <p className="text-gray-600">Tailored loan products specifically designed for agricultural needs and cycles.</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <div className="bg-agri-light w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Sprout className="text-agri-primary h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Paperless Process</h3>
                        <p className="text-gray-600">Complete digital workflow from application to disbursement. No more paperwork.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
