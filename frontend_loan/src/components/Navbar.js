import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import API from '../api';
import {
    Menu,
    X,
    Sprout,
    User,
    LogOut,
    LayoutDashboard,
    FileText,
    Activity,
    ChevronDown,
    Calculator,
    Shield
} from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { admin, adminLogout } = useAdminAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [profilePhoto, setProfilePhoto] = useState(null);
    const dropdownRef = useRef(null);

    // Detect if we are on an admin/manager page
    const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/manager');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (user && !isAdminPage) {
            const fetchProfilePhoto = async () => {
                try {
                    const { data } = await API.get('/auth/profile');
                    if (data.user?.profilePhoto) {
                        setProfilePhoto(data.user.profilePhoto);
                    }
                } catch (error) {
                    console.error("Profile photo fetch error", error);
                }
            };
            fetchProfilePhoto();
        }
    }, [user, isAdminPage]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsOpen(false);
        setIsProfileOpen(false);
    };

    const handleAdminLogout = () => {
        adminLogout();
        setIsOpen(false);
        setIsProfileOpen(false);
    };

    const isActive = (path) => location.pathname === path;

    const navLinkClass = (path) =>
        `px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2
        ${isActive(path)
            ? 'bg-white text-green-800 shadow-md'
            : 'text-white hover:bg-white/20'
        }`;

    // ===== ADMIN/MANAGER NAVBAR =====
    if (isAdminPage && admin) {
        return (
            <>
                <div className="bg-green-950 text-white text-xs text-center py-1 tracking-wide">
                    Bank Manager Portal • Smart Agri Loan System
                </div>

                <nav className="bg-gradient-to-r from-green-800 via-green-700 to-green-900 
                                shadow-lg sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex justify-between h-16 items-center">

                            <Link to="/manager/dashboard" className="flex items-center gap-3 text-white">
                                <div className="bg-yellow-400 p-2 rounded-lg shadow-md">
                                    <Shield className="h-6 w-6 text-green-900" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg tracking-wide">
                                        Smart Agri Loan
                                    </h1>
                                    <p className="text-xs text-green-200">
                                        Bank Manager Panel
                                    </p>
                                </div>
                            </Link>

                            {/* Desktop Nav */}
                            <div className="hidden md:flex items-center gap-2">
                                <Link to="/manager/dashboard" className={navLinkClass('/manager/dashboard')}>
                                    <LayoutDashboard size={18} /> Dashboard
                                </Link>

                                {/* Profile Dropdown */}
                                <div className="relative ml-4" ref={dropdownRef}>
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 bg-white text-green-800 
                                                   px-3 py-2 rounded-full shadow-md"
                                    >
                                        <Shield size={16} />
                                        {admin.username}
                                        <ChevronDown size={14} />
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2">
                                            <button
                                                onClick={handleAdminLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut size={16} className="inline mr-2" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Menu Button */}
                            <div className="md:hidden text-white">
                                <button onClick={() => setIsOpen(!isOpen)}>
                                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isOpen && (
                        <div className="md:hidden bg-green-800 text-white px-6 py-4 space-y-3">
                            <Link to="/manager/dashboard" onClick={() => setIsOpen(false)} className="block">
                                Dashboard
                            </Link>
                            <button onClick={handleAdminLogout} className="text-red-300">
                                Logout
                            </button>
                        </div>
                    )}
                </nav>
            </>
        );
    }

    // ===== FARMER/USER NAVBAR =====
    return (
        <>
            {/* Top Government Strip */}
            <div className="bg-green-900 text-white text-xs text-center py-1 tracking-wide">
                Government of India • Ministry of Agriculture & Farmers Welfare
            </div>

            <nav className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 
                            shadow-lg sticky top-0 z-50">

                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between h-16 items-center">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 text-white">
                            <div className="bg-yellow-400 p-2 rounded-lg shadow-md">
                                <Sprout className="h-6 w-6 text-green-900" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg tracking-wide">
                                    Smart Agri Loan
                                </h1>
                                <p className="text-xs text-green-100">
                                    Digital Farmer Credit Portal
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-2">

                            {user ? (
                                <>
                                    <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                                        <LayoutDashboard size={18} /> Dashboard
                                    </Link>
                                    <Link to="/loan-apply" className={navLinkClass('/loan-apply')}>
                                        <FileText size={18} /> Apply
                                    </Link>
                                    <Link to="/loan-status" className={navLinkClass('/loan-status')}>
                                        <Activity size={18} /> My Loans
                                    </Link>
                                    <Link to="/emi-calculator" className={navLinkClass('/emi-calculator')}>
                                        <Calculator size={18} /> EMI
                                    </Link>

                                    {/* Profile Dropdown */}
                                    <div className="relative ml-4" ref={dropdownRef}>
                                        <button
                                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                                            className="flex items-center gap-2 bg-white text-green-800 
                                                       px-3 py-2 rounded-full shadow-md"
                                        >
                                            <User size={16} />
                                            {user.username}
                                            <ChevronDown size={14} />
                                        </button>

                                        {isProfileOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="block px-4 py-2 text-sm hover:bg-green-50"
                                                >
                                                    My Profile
                                                </Link>

                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut size={16} className="inline mr-2" />
                                                    Logout
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : isAdminPage ? (
                                <>
                                    <Link to="/admin" className="text-white font-semibold flex items-center gap-2 px-4 py-2 hover:bg-white/20 rounded-lg transition-colors">
                                        <Shield size={16} /> Login
                                    </Link>
                                    <Link
                                        to="/admin/register"
                                        className="bg-yellow-400 text-green-900 px-4 py-2 rounded-lg font-bold shadow-md hover:bg-yellow-300 transition"
                                    >
                                        Register
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-white font-semibold px-4 py-2 hover:bg-white/20 rounded-lg">
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-yellow-400 text-green-900 px-4 py-2 rounded-lg font-bold shadow-md hover:bg-yellow-300 transition"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden text-white">
                            <button onClick={() => setIsOpen(!isOpen)}>
                                {isOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden bg-green-800 text-white px-6 py-4 space-y-3">
                        {user ? (
                            <>
                                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block">Dashboard</Link>
                                <Link to="/loan-apply" onClick={() => setIsOpen(false)} className="block">Apply Loan</Link>
                                <Link to="/loan-status" onClick={() => setIsOpen(false)} className="block">My Loans</Link>
                                <Link to="/emi-calculator" onClick={() => setIsOpen(false)} className="block">EMI Calculator</Link>
                                <Link to="/profile" onClick={() => setIsOpen(false)} className="block">Profile</Link>
                                <button onClick={handleLogout} className="text-red-300">Logout</button>
                            </>
                        ) : isAdminPage ? (
                            <>
                                <Link to="/admin" onClick={() => setIsOpen(false)} className="block">Manager Login</Link>
                                <Link to="/admin/register" onClick={() => setIsOpen(false)} className="block text-yellow-300">Manager Register</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsOpen(false)} className="block">Login</Link>
                                <Link to="/register" onClick={() => setIsOpen(false)} className="block text-yellow-300">Register</Link>
                            </>
                        )}
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navbar;