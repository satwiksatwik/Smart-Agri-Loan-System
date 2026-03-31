const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized. No user found." });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
};

// Bank Manager middleware - allows both admin and bank_manager roles
const bankManager = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authorized. No user found." });
    }

    if (req.user.role !== "admin" && req.user.role !== "bank_manager") {
        return res.status(403).json({ message: "Access denied. Bank Managers only." });
    }

    next();
};

module.exports = { admin, bankManager };
