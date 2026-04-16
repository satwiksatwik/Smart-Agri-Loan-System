require("dotenv").config();
process.env.NODE_ENV = process.env.NODE_ENV || "development";
console.log("Mongo URI:", process.env.MONGO_URI);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("./middleware/xssClean");
const mongoSanitize = require("./middleware/mongoSanitize");
const hpp = require("hpp");
const path = require("path");
const morgan = require("morgan");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");
const blockchainService = require("./services/blockchainService");

connectDB();

const app = express();

// ================= SECURITY =================
app.use(helmet());
app.use(cors());

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize);
app.use(xss);
app.use(hpp());

// ================= RATE LIMITING =================
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many requests from this IP, please try again later."
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many login attempts, please try again later."
});

app.use("/api/auth", authLimiter);
app.use("/api", globalLimiter);

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= ROUTES =================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/loan", require("./routes/loanRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/manager", require("./routes/managerRoutes"));
app.use("/api/emi", require("./routes/emiRoutes"));
app.use("/api/audit", require("./routes/auditRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));

// ================= ERROR HANDLER =================
app.use(errorHandler);

// ================= BLOCKCHAIN INIT =================
const initBlockchain = async () => {
    try {
        const success = await blockchainService.initialize();
        if (success) {
            console.log("⛓️  Blockchain service connected");
        } else {
            console.warn("⚠️  Blockchain service not available (deploy the contract first)");
        }
    } catch (err) {
        console.warn("⚠️  Blockchain init skipped:", err.message);
    }
};

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initBlockchain();
});