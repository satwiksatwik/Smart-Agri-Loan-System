import axios from "axios";

const AdminAPI = axios.create({
    baseURL: "http://localhost:5001/api",
});

// Attach admin JWT token automatically
AdminAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Auto logout if admin token invalid
AdminAPI.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/admin";
        }
        return Promise.reject(error);
    }
);

export default AdminAPI;
