const errorHandler = (err, req, res, next) => {
    console.error("🔥 ERROR:", err);

    let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    let message = err.message || "Internal Server Error";

    /* ================= MULTER ERROR ================= */
    if (err.name === "MulterError") {
        statusCode = 400;
        message = err.message;
    }

    /* ================= MONGOOSE VALIDATION ERROR ================= */
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map(val => val.message)
            .join(", ");
    }

    /* ================= DUPLICATE KEY ERROR ================= */
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `${field} already exists`;
    }

    /* ================= JWT ERRORS ================= */
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token expired";
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
};

module.exports = errorHandler;
