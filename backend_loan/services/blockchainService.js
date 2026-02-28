const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            // Use the first account from Hardhat's default accounts
            const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY ||
                "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
            this.signer = new ethers.Wallet(privateKey, this.provider);

            // Load contract ABI and address
            const contractPath = path.join(__dirname, "../contracts/LoanManagement.json");
            if (!fs.existsSync(contractPath)) {
                console.warn("⚠️  Contract ABI not found. Deploy the contract first.");
                return false;
            }

            const contractData = JSON.parse(fs.readFileSync(contractPath, "utf8"));
            const contractAddress = process.env.CONTRACT_ADDRESS || contractData.address;

            this.contract = new ethers.Contract(
                contractAddress,
                contractData.abi,
                this.signer
            );

            this.initialized = true;
            console.log("✅ Blockchain service initialized. Contract:", contractAddress);
            return true;
        } catch (error) {
            console.error("❌ Blockchain init error:", error.message);
            return false;
        }
    }

    isReady() {
        return this.initialized && this.contract !== null;
    }

    // Create a loan on-chain
    async createLoanOnChain(borrowerName, applicationNumber, amount, creditScore, loanType) {
        if (!this.isReady()) {
            console.warn("Blockchain not ready, skipping on-chain creation");
            return null;
        }

        try {
            const tx = await this.contract.createLoan(
                borrowerName,
                applicationNumber,
                ethers.parseUnits(amount.toString(), 0),
                ethers.parseUnits(creditScore.toString(), 0),
                loanType
            );
            const receipt = await tx.wait();

            // Extract loanId from events
            let loanId = null;
            if (receipt.logs) {
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = this.contract.interface.parseLog(log);
                        if (parsedLog && parsedLog.name === "LoanCreated") {
                            loanId = parsedLog.args.loanId.toString();
                            break;
                        }
                    } catch (e) {
                        // Skip logs that don't belong to this contract or don't match
                    }
                }
            }

            console.log(`✅ Loan created on chain. ID: ${loanId}, Tx: ${receipt.hash}`);
            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                loanId: loanId,
            };
        } catch (error) {
            console.error("❌ Blockchain createLoan error:", error.message);
            return null;
        }
    }

    // Approve a loan on-chain
    async approveLoanOnChain(blockchainLoanId, interestRate) {
        if (!this.isReady()) return null;

        try {
            const tx = await this.contract.approveLoan(
                blockchainLoanId,
                ethers.parseUnits(interestRate.toString(), 0)
            );
            const receipt = await tx.wait();
            console.log("✅ Loan approved on chain. Tx:", receipt.hash);
            return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
        } catch (error) {
            console.error("❌ Blockchain approveLoan error:", error.message);
            return null;
        }
    }

    // Reject a loan on-chain
    async rejectLoanOnChain(blockchainLoanId, reason) {
        if (!this.isReady()) return null;

        try {
            const tx = await this.contract.rejectLoan(blockchainLoanId, reason);
            const receipt = await tx.wait();
            console.log("✅ Loan rejected on chain. Tx:", receipt.hash);
            return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
        } catch (error) {
            console.error("❌ Blockchain rejectLoan error:", error.message);
            return null;
        }
    }

    // Record a repayment on-chain
    async recordRepaymentOnChain(blockchainLoanId, amount, emiNumber) {
        if (!this.isReady()) return null;

        try {
            const tx = await this.contract.recordRepayment(
                blockchainLoanId,
                ethers.parseUnits(amount.toString(), 0),
                emiNumber
            );
            const receipt = await tx.wait();
            console.log("✅ Repayment recorded on chain. Tx:", receipt.hash);
            return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
        } catch (error) {
            console.error("❌ Blockchain recordRepayment error:", error.message);
            return null;
        }
    }

    // Get transaction history from chain
    async getTransactionHistory() {
        if (!this.isReady()) return [];

        try {
            const logs = await this.contract.getTransactionHistory();
            return logs.map((log) => ({
                loanId: Number(log.loanId),
                action: log.action,
                timestamp: Number(log.timestamp),
                details: log.details,
            }));
        } catch (error) {
            console.error("❌ getTransactionHistory error:", error.message);
            return [];
        }
    }

    // Get transaction count
    async getTransactionCount() {
        if (!this.isReady()) return 0;

        try {
            const count = await this.contract.getTransactionCount();
            return Number(count);
        } catch (error) {
            console.error("❌ getTransactionCount error:", error.message);
            return 0;
        }
    }

    // Get loan count
    async getLoanCount() {
        if (!this.isReady()) return 0;

        try {
            const count = await this.contract.loanCount();
            return Number(count);
        } catch (error) {
            return 0;
        }
    }
}

// Singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
