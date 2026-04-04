import {
  AlertTriangle,
  FileText,
  Activity,
  User,
  LogOut,
  Sprout,
  TrendingUp,
  Hash,
  Calculator
} from "lucide-react";

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const [summary, setSummary] = React.useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  const [animatedStats, setAnimatedStats] = React.useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  const [creditScore, setCreditScore] = React.useState(0);
  const [latestLoan, setLatestLoan] = React.useState(null);

  /* ================= FETCH DATA ================= */
  React.useEffect(() => {

    const fetchSummary = async () => {
      try {
        const { data } = await API.get('/loan/summary');
        setSummary(data);
      } catch (error) {
        console.error("Failed to fetch summary", error);
      }
    };

    const fetchLatestLoan = async () => {
      try {
        const { data } = await API.get("/loan/my-loans");
        if (data.length > 0) {
          setLatestLoan(data[0]);
          if (data[0].creditScore) {
            setCreditScore(data[0].creditScore);
          }
        }
      } catch (error) {
        console.error("Failed to fetch latest loan", error);
      }
    };

    fetchSummary();
    fetchLatestLoan();

  }, []);

  /* ================= ANIMATION ================= */
  React.useEffect(() => {
    const duration = 800;
    const steps = 40;
    const interval = duration / steps;

    ["total", "approved", "pending", "rejected"].forEach((key) => {
      let current = 0;
      const increment = summary[key] / steps;

      const timer = setInterval(() => {
        current += increment;

        setAnimatedStats(prev => ({
          ...prev,
          [key]: Math.floor(current)
        }));

        if (current >= summary[key]) {
          setAnimatedStats(prev => ({
            ...prev,
            [key]: summary[key]
          }));
          clearInterval(timer);
        }
      }, interval);
    });

  }, [summary]);

  /* ================= CREDIT GAUGE ================= */
  const gaugeRotation = (creditScore / 900) * 180;

  const getScoreColor = () => {
    if (creditScore >= 750) return "text-green-600";
    if (creditScore >= 650) return "text-yellow-500";
    return "text-red-600";
  };

  return (
    <div className="page-bg min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="max-w-7xl mx-auto">

        {/* ================= WELCOME ================= */}
        <div className="bg-white card-premium p-8 mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-green-700">{user?.username}</span>
              </h1>

              <p className="text-gray-600 mt-2">
                Government Agricultural Financial Assistance Portal 🌾
              </p>

              {/* ✅ APPLICATION NUMBER BADGE */}
              {latestLoan && latestLoan.applicationNumber && (
                <div className="mt-4 inline-flex items-center gap-2 
                                bg-gradient-to-r from-green-100 to-yellow-100 
                                px-4 py-2 rounded-full border border-green-300 shadow-sm">
                  <Hash size={16} className="text-green-700" />
                  <span className="text-xs font-semibold text-gray-600">
                    Application No:
                  </span>
                  <span className="font-bold text-green-800 tracking-wide">
                    {latestLoan.applicationNumber}
                  </span>
                </div>
              )}

            </div>

            <div className="bg-green-100 px-4 py-2 rounded-xl text-green-800 font-semibold flex items-center gap-2 shadow-sm">
              <Sprout size={20} />
              Farmer Dashboard
            </div>

          </div>
        </div>

        {/* ================= CREDIT SCORE GAUGE ================= */}
        <div className="bg-white card-premium p-8 mb-10 text-center">
          <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
            <TrendingUp size={22} /> Credit Health Meter
          </h2>

          <div className="relative w-64 h-32 mx-auto">
            <div className="absolute w-full h-full rounded-t-full bg-gray-200"></div>

            <div
              className="absolute w-full h-full rounded-t-full bg-green-400 origin-bottom"
              style={{
                transform: `rotate(${gaugeRotation}deg)`,
                clipPath: "polygon(0% 100%, 100% 100%, 100% 0%)",
                transition: "transform 1s ease-in-out"
              }}
            ></div>

            <div className="absolute bottom-0 left-0 right-0 text-center">
              <p className={`text-3xl font-bold ${getScoreColor()}`}>
                {creditScore || "—"}
              </p>
              <p className="text-sm text-gray-500">Credit Score</p>
            </div>
          </div>
        </div>

        {/* ================= CREDIT IMPROVEMENT ================= */}
        {latestLoan && latestLoan.status === "Rejected" && (
          <div className="bg-gradient-to-r from-red-100 to-yellow-100 
                          p-6 rounded-2xl shadow-md border border-red-200 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-600" size={24} />
              <h3 className="text-xl font-bold text-red-700">
                Improve Your Loan Eligibility
              </h3>
            </div>

            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Pay existing loans on time.</li>
              <li>Avoid taking multiple loans at once.</li>
              <li>Increase stable agricultural income.</li>
              <li>Improve irrigation and soil management.</li>
              <li>Maintain proper land ownership records.</li>
            </ul>
          </div>
        )}

        {/* ================= SUMMARY ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Loans" value={animatedStats.total} bg="bg-blue-50" text="text-blue-700" />
          <StatCard title="Approved" value={animatedStats.approved} bg="bg-green-50" text="text-green-700" />
          <StatCard title="Pending" value={animatedStats.pending} bg="bg-yellow-50" text="text-yellow-700" />
          <StatCard title="Rejected" value={animatedStats.rejected} bg="bg-red-50" text="text-red-700" />
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            to="/loan-apply"
            icon={<FileText className="text-blue-600 h-8 w-8" />}
            title="Apply for Loan"
            desc="Start new agricultural loan application."
          />
          <ActionCard
            to="/loan-status"
            icon={<Activity className="text-purple-600 h-8 w-8" />}
            title="My Loans"
            desc="Track your submitted loan requests."
          />
          <ActionCard
            to="/emi-calculator"
            icon={<Calculator className="text-green-600 h-8 w-8" />}
            title="EMI Calculator"
            desc="Calculate your monthly EMI and amortization."
          />
          <ActionCard
            to="/profile"
            icon={<User className="text-orange-600 h-8 w-8" />}
            title="Profile"
            desc="Manage personal information."
          />
        </div>

        {/* ================= LOGOUT ================= */}
        <div className="mt-10 text-center">
          <button
            onClick={logout}
            className="px-6 py-3 rounded-xl bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition"
          >
            <LogOut size={18} className="inline mr-2" />
            Logout
          </button>
        </div>

      </div>
    </div>
  );
};

/* ================= REUSABLE ================= */

const StatCard = ({ title, value, bg, text }) => (
  <div className={`p-6 rounded-2xl shadow-md ${bg} text-center card-premium`}>
    <p className="text-sm font-semibold uppercase mb-2">{title}</p>
    <h3 className={`text-3xl font-bold ${text}`}>{value}</h3>
  </div>
);

const ActionCard = ({ to, icon, title, desc }) => (
  <Link
    to={to}
    className="block bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition transform"
  >
    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{desc}</p>
  </Link>
);

export default Dashboard;