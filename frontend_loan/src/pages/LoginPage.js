import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import OTPInput from '../components/OTPInput';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { LogIn, Mail, KeyRound } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [loginMethod, setLoginMethod] = useState('password');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');

    const [isOtpSent, setIsOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    /* ===============================
       PASSWORD LOGIN
    =============================== */
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await API.post('/auth/login', {
                username,
                password
            });

            // ✅ Store token, role, username properly
            login(data);
            navigate('/dashboard');

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    /* ===============================
       SEND OTP
    =============================== */
    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await API.post('/auth/send-otp', { email, type: 'login' });

            setIsOtpSent(true);
            setTimer(30);
            setSuccessMsg('OTP sent successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    /* ===============================
       VERIFY OTP LOGIN
    =============================== */
    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data } = await API.post('/auth/login-otp', { email, otp });

            // ✅ Use AuthContext login
            login(data);
            navigate('/dashboard');

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or Expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const resetState = (method) => {
        setLoginMethod(method);
        setError('');
        setSuccessMsg('');
        setIsOtpSent(false);
        setOtp('');
        setTimer(0);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-gray-50">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">

                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-agri-light rounded-full flex items-center justify-center">
                        <LogIn className="h-6 w-6 text-agri-primary" />
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Welcome Back
                    </h2>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => resetState('password')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md ${loginMethod === 'password'
                            ? 'bg-white shadow-sm'
                            : 'text-gray-500'
                            }`}
                    >
                        <KeyRound size={16} className="inline mr-2" />
                        Password
                    </button>
                    <button
                        onClick={() => resetState('otp')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md ${loginMethod === 'otp'
                            ? 'bg-white shadow-sm'
                            : 'text-gray-500'
                            }`}
                    >
                        <Mail size={16} className="inline mr-2" />
                        OTP Login
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="bg-green-50 text-green-600 p-3 rounded text-sm">
                        {successMsg}
                    </div>
                )}

                {/* PASSWORD LOGIN */}
                {loginMethod === 'password' && (
                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                        <Input
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-agri-primary text-white py-3 rounded-lg"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {/* OTP LOGIN */}
                {loginMethod === 'otp' && (
                    <div className="space-y-4">
                        {!isOtpSent ? (
                            <form onSubmit={handleSendOTP}>
                                <Input
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-agri-primary text-white py-3 rounded-lg"
                                >
                                    Send OTP
                                </button>
                            </form>
                        ) : (
                            <>
                                <OTPInput value={otp} onChange={setOtp} length={6} />
                                <button
                                    onClick={handleVerifyOTP}
                                    className="w-full bg-agri-primary text-white py-3 rounded-lg"
                                >
                                    Verify & Login
                                </button>
                            </>
                        )}
                    </div>
                )}

                <div className="text-center mt-4">
                    <Link to="/register" className="text-agri-primary">
                        Don't have an account? Register
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
