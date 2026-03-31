/**
 * Sync existing MongoDB loans to the blockchain.
 * Run this after a fresh Hardhat node restart to re-record all loans on-chain.
 * 
 * Usage: node syncBlockchain.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Loan = require("./models/Loan");
const blockchainService = require("./services/blockchainService");

async function syncLoansToBlockchain() {
    console.log("🔄 Starting blockchain sync...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Initialize blockchain
    const bcReady = await blockchainService.initialize();
    if (!bcReady) {
        console.error("❌ Blockchain service not available. Make sure Hardhat node is running and contract is deployed.");
        process.exit(1);
    }
    console.log("✅ Blockchain service initialized\n");

    // Fetch all loans from MongoDB
    const loans = await Loan.find({}).sort({ createdAt: 1 });
    console.log(`📋 Found ${loans.length} loan(s) in MongoDB\n`);

    let synced = 0;
    let errors = 0;

    for (const loan of loans) {
        console.log(`--- Processing: ${loan.applicationNumber} (${loan.fullName}) ---`);
        console.log(`   Status: ${loan.status}, Current Blockchain ID: ${loan.blockchainLoanId || "NONE"}`);

        try {
            // Step 1: Create loan on-chain
            const createResult = await blockchainService.createLoanOnChain(
                loan.fullName,
                loan.applicationNumber,
                Math.round(Number(loan.loanAmount)),
                Number(loan.creditScore),
                loan.loanType || "Unknown"
            );

            if (!createResult || !createResult.loanId) {
                console.log(`   ⚠️  Failed to create loan on chain, skipping`);
                errors++;
                continue;
            }

            loan.blockchainLoanId = createResult.loanId;
            loan.blockchainTxHash = createResult.txHash;
            console.log(`   ✅ Created on-chain. Loan ID: ${createResult.loanId}, Tx: ${createResult.txHash}`);

            // Step 2: If approved, approve on-chain too
            if (loan.status === "Approved") {
                const interestRate = loan.interestRate || 8.5;
                const approveResult = await blockchainService.approveLoanOnChain(
                    parseInt(createResult.loanId),
                    Math.round(interestRate * 100)  // basis points
                );

                if (approveResult) {
                    loan.blockchainTxHash = approveResult.txHash;
                    console.log(`   ✅ Approved on-chain. Tx: ${approveResult.txHash}`);
                }
            }

            // Step 3: If rejected, reject on-chain
            if (loan.status === "Rejected") {
                const rejectResult = await blockchainService.rejectLoanOnChain(
                    parseInt(createResult.loanId),
                    loan.rejectionReason || "Rejected by Bank Manager"
                );

                if (rejectResult) {
                    loan.blockchainTxHash = rejectResult.txHash;
                    console.log(`   ✅ Rejected on-chain. Tx: ${rejectResult.txHash}`);
                }
            }

            // Save updated blockchain fields to MongoDB
            await loan.save();
            synced++;
            console.log(`   💾 MongoDB updated\n`);

        } catch (error) {
            console.error(`   ❌ Error syncing loan ${loan.applicationNumber}:`, error.message);
            errors++;
        }
    }

    console.log("=".repeat(50));
    console.log(`\n🎉 Sync complete!`);
    console.log(`   Total: ${loans.length}`);
    console.log(`   Synced: ${synced}`);
    console.log(`   Errors: ${errors}`);

    // Verify
    const txCount = await blockchainService.getTransactionCount();
    const loanCount = await blockchainService.getLoanCount();
    console.log(`\n⛓️  Blockchain state:`);
    console.log(`   Transaction count: ${txCount}`);
    console.log(`   Loan count: ${loanCount}`);

    process.exit(0);
}

syncLoansToBlockchain().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
