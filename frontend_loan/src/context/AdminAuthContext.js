import React, { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load admin on refresh
    useEffect(() => {
        const storedAdmin = sessionStorage.getItem("adminUser");
        const token = sessionStorage.getItem("adminToken");

        if (storedAdmin && token) {
            setAdmin(JSON.parse(storedAdmin));
        }

        setLoading(false);
    }, []);

    // LOGIN
    const adminLogin = (data) => {
        sessionStorage.setItem("adminToken", data.token);

        const adminData = {
            username: data.username,
            role: data.role,
        };

        sessionStorage.setItem("adminUser", JSON.stringify(adminData));
        setAdmin(adminData);
    };

    // LOGOUT
    const adminLogout = () => {
        sessionStorage.removeItem("adminToken");
        sessionStorage.removeItem("adminUser");
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
