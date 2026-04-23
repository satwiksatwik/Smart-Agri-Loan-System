import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import OTPInput from '../components/OTPInput';
import API from '../api';
import { UserPlus, ArrowRight, ShieldCheck, Lock, CheckCircle } from 'lucide-react';

const RegisterPage = () => {
    const navigate = useNavigate();

    // Stages: 'email' -> 'otp' -> 'details'
    const [step, setStep] = useState('email');

    // Form State
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [userDetails, setUserDetails] = useState({
        username: '',
        mobile: '',
        password: '',
        confirmPassword: ''
    });

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [timer, setTimer] = useState(0);

    // Timer Logic
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Handlers
    const handleDetailChange = (e) => {
        setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
    };

    // STAGE 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await API.post('/auth/send-otp', { email, type: 'register' });
            setSuccessMsg(`OTP sent to ${email}`);
            setStep('otp');
            setTimer(30);
            setOtp(''); // Clear previous OTP if any
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // STAGE 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await API.post('/auth/verify-otp', { email, otp });
            setSuccessMsg('Email verified successfully!');
            setStep('details');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // STAGE 3: Complete Registration
    const handleRegister = async (e) => {
        e.preventDefault();
        const { username, mobile, password, confirmPassword } = userDetails;

        // Validation
        if (!username || !mobile || !password) {
            setError('All fields are required');
            return;
        }
        if (!/^\d{10}$/.test(mobile)) {
            setError('Mobile number must be 10 digits');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await API.post('/auth/register', {
                username,
                mobile,
                email, // Verified email
                password
            });
            setStep('success'); // Show success animation
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">

                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-agri-light rounded-full flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-agri-primary" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Create an Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Join the Smart Agriculture Loan Portal
                    </p>
                </div>

                {/* Progress Indicators (Optional) */}
                <div className="flex justify-center space-x-2 mt-4">
                    <div className={`h-2 w-1/3 rounded-full ${step === 'email' ? 'bg-agri-primary' : (step === 'otp' || step === 'details' || step === 'success') ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 w-1/3 rounded-full ${step === 'otp' ? 'bg-agri-primary' : (step === 'details' || step === 'success') ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 w-1/3 rounded-full ${step === 'details' ? 'bg-agri-primary' : step === 'success' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-fade-in">
                        {error}
                    </div>
                )}
                {successMsg && !error && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm animate-fade-in flex items-center">
                        <CheckCircle size={16} className="mr-2" /> {successMsg}
                    </div>
                )}

                {/* STAGE 1: Email */}
                {step === 'email' && (
                    <form onSubmit={handleSendOTP} className="mt-8 space-y-6 animate-fade-in">
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading || timer > 0}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-agri-primary hover:bg-agri-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-agri-primary transition-colors disabled:opacity-70 shadow-sm"
                        >
                            {loading ? 'Sending OTP...' : (timer > 0 ? `Resend in ${timer}s` : 'Send OTP')}
                            {!loading && timer === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
                        </button>
                        <div className="text-center mt-4">
                            <span className="text-sm text-gray-600">Already have an account? </span>
                            <Link to="/login" className="font-medium text-agri-primary hover:text-agri-dark">
                                Sign in
                            </Link>
                        </div>
                    </form>
                )}

                {/* STAGE 2: Verify OTP */}
                {step === 'otp' && (
                    <div className="mt-8 space-y-6 animate-fade-in">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Enter the 6-digit code sent to <strong>{email}</strong>
                            </p>
                            <button
                                onClick={() => setStep('email')}
                                className="text-xs text-agri-primary underline mt-1"
                            >
                                Change Email
                            </button>
                        </div>

                        <OTPInput value={otp} onChange={setOtp} length={6} />

                        <button
                            onClick={handleVerifyOTP}
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-agri-primary hover:bg-agri-dark transition-colors disabled:opacity-70"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        {timer > 0 ? (
                            <p className="text-center text-sm text-gray-500">Resend OTP in {timer}s</p>
                        ) : (
                            <button
                                onClick={handleSendOTP}
                                className="w-full text-center text-sm text-agri-primary hover:underline"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                )}

                {/* STAGE 3: Details */}
                {step === 'details' && (
                    <form onSubmit={handleRegister} className="mt-8 space-y-4 animate-fade-in">
                        {/* Locked Email */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Verified)</label>
                            <div className="flex items-center border border-green-300 rounded-lg px-3 py-2 bg-green-50">
                                <Lock size={16} className="text-green-600 mr-2" />
                                <span className="text-gray-700 flex-1">{email}</span>
                                <CheckCircle size={16} className="text-green-600" />
                            </div>
                        </div>

                        <Input
                            label="Username"
                            name="username"
                            value={userDetails.username}
                            onChange={handleDetailChange}
                            placeholder="Choose a username"
                            required
                        />
                        <Input
                            label="Mobile Number"
                            name="mobile"
                            type="tel"
                            maxLength={10}
                            value={userDetails.mobile}
                            onChange={handleDetailChange}
                            placeholder="10-digit mobile number"
                            required
                        />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                value={userDetails.password}
                                onChange={handleDetailChange}
                                placeholder="••••••••"
                                required
                            />
                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={userDetails.confirmPassword}
                                onChange={handleDetailChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-agri-primary hover:bg-agri-dark transition-colors disabled:opacity-70 shadow-sm mt-6"
                        >
                            {loading ? 'Creating Account...' : 'Complete Registration'}
                        </button>
                    </form>
                )}

                {/* Success State */}
                {step === 'success' && (
                    <div className="mt-8 text-center animate-scale-in">
                        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Registration Successful!</h3>
                        <p className="mt-2 text-gray-600">Redirecting to login page...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;
