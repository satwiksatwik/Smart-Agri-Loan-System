import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';

import Dashboard from './pages/Dashboard';

import LoanApplication from './pages/LoanApplication';
import LoanStatus from './pages/LoanStatus';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerLoanDetail from './pages/ManagerLoanDetail';
import EMICalculator from './pages/EMICalculator';
import RepaymentTracking from './pages/RepaymentTracking';

// Protected Route Component (For authenticated users)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (user) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

// Admin Login Route — redirect if admin is already logged in
const AdminPublicRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (admin) {
    return <Navigate to="/manager/dashboard" />;
  }
  return children;
};

// Manager Route Component (For bank_manager and admin roles via admin session)
const ManagerRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (!admin) return <Navigate to="/admin" />;
  if (admin.role !== 'bank_manager' && admin.role !== 'admin') {
    return <Navigate to="/admin" />;
  }

  return children;
};

// Admin Dashboard Route (Only for admin role via admin session)
const AdminRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (!admin) return <Navigate to="/admin" />;
  if (admin.role !== 'admin') return <Navigate to="/manager/dashboard" />;

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AdminAuthProvider>
          <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />
            <Routes>
              {/* Public Routes (Farmer) */}
              <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

              {/* Farmer Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/loan-apply" element={<ProtectedRoute><LoanApplication /></ProtectedRoute>} />
              <Route path="/loan-status" element={<ProtectedRoute><LoanStatus /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/emi-calculator" element={<ProtectedRoute><EMICalculator /></ProtectedRoute>} />
              <Route path="/repayment/:loanId" element={<ProtectedRoute><RepaymentTracking /></ProtectedRoute>} />

              {/* Admin Login (separate from farmer login) */}
              <Route path="/admin" element={<AdminPublicRoute><AdminLoginPage /></AdminPublicRoute>} />

              {/* Admin Dashboard */}
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* Manager Routes (uses admin session) */}
              <Route path="/manager/dashboard" element={<ManagerRoute><ManagerDashboard /></ManagerRoute>} />
              <Route path="/manager/loan/:id" element={<ManagerRoute><ManagerLoanDetail /></ManagerRoute>} />
            </Routes>
          </div>
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
