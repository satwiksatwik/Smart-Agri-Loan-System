/**
 * Reset Script — Clears Loan and AuditLog collections from MongoDB
 * Also deletes uploaded files from uploads/ directory
 * 
 * Run: node resetDB.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const connectDB = require("./config/db");

const resetDB = async () => {
    try {
        await connectDB();

        console.log("⚠️  Clearing Loan collection...");
        await mongoose.connection.db.collection("loans").deleteMany({});
        console.log("✅ Loans cleared");

        console.log("⚠️  Clearing AuditLog collection...");
        await mongoose.connection.db.collection("auditlogs").deleteMany({});
        console.log("✅ AuditLogs cleared");

        // Clear uploaded files
        const uploadsDir = path.join(__dirname, "uploads");
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            let deleted = 0;
            for (const file of files) {
                if (file === ".gitkeep") continue;
                fs.unlinkSync(path.join(uploadsDir, file));
                deleted++;
            }
            console.log(`✅ Deleted ${deleted} uploaded files`);
        }

        // Clear user document references (so they'll re-upload on next application)
        console.log("⚠️  Clearing user document references...");
        await mongoose.connection.db.collection("users").updateMany({}, {
            $set: {
                "documents.adangal": "",
                "documents.incomeCertificate": "",
                "documents.aadhaar": "",
                "documents.pan": "",
                "documents.photo": "",
            }
        });
        console.log("✅ User document references cleared");

        console.log("\n🎉 Database reset complete!");
        console.log("Next steps:");
        console.log("  1. Stop & restart Hardhat node: npx hardhat node");
        console.log("  2. Delete blockchain/deployment.json");
        console.log("  3. Redeploy: npx hardhat run scripts/deploy.js --network localhost");
        console.log("  4. Restart backend: npm start");

        process.exit(0);
    } catch (error) {
        console.error("❌ Reset failed:", error);
        process.exit(1);
    }
};

resetDB();
