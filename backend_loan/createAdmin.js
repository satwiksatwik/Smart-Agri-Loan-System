require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
    const existing = await User.findOne({ email: "admin@agriloan.com" });
    if (existing) {
        console.log("Admin already exists");
        process.exit();
    }

    const admin = new User({
        username: "admin",
        email: "admin@agriloan.com",
        mobile: "9999999999",
        password: "Admin@123",
        role: "admin",
        isVerified: true
    });

    await admin.save();
    console.log("Admin created successfully");
    process.exit();
};

createAdmin();
