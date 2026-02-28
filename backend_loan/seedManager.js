require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");

async function seedManager() {
    await connectDB();

    const existing = await User.findOne({ username: "admin" });

    if (existing) {
        console.log("⚠️  Bank Manager user already exists.");

        // Ensure role is bank_manager
        if (existing.role !== "bank_manager") {
            existing.role = "bank_manager";
            await existing.save();
            console.log("✅ Updated existing admin user role to bank_manager");
        }
    } else {
        const user = new User({
            username: "admin",
            email: "admin@smartagriloan.com",
            password: "admin@123",
            role: "bank_manager",
            isVerified: true,
            mobile: "9999999999",
        });

        await user.save();
        console.log("✅ Bank Manager created successfully!");
        console.log("   Username: admin");
        console.log("   Password: admin@123");
    }

    await mongoose.disconnect();
    console.log("✅ Done.");
}

seedManager().catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
});
