import React, { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load admin on refresh
    useEffect(() => {
        const storedAdmin = localStorage.getItem("adminUser");
        const token = localStorage.getItem("adminToken");

        if (storedAdmin && token) {
            setAdmin(JSON.parse(storedAdmin));
        }

        setLoading(false);
    }, []);

    // LOGIN
    const adminLogin = (data) => {
        localStorage.setItem("adminToken", data.token);

        const adminData = {
            username: data.username,
            role: data.role,
        };

        localStorage.setItem("adminUser", JSON.stringify(adminData));
        setAdmin(adminData);
    };

    // LOGOUT
    const adminLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setAdmin(null);
        window.location.href = "/admin";
    };

    return (
        <AdminAuthContext.Provider value={{ admin, adminLogin, adminLogout, loading }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
