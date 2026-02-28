const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying LoanManagement contract...");

    const [deployer] = await ethers.getSigners();
    console.log("📍 Deployer address:", deployer.address);

    const deploymentPath = path.join(__dirname, "../deployment.json");
    let contractAddress;
    let alreadyDeployed = false;

    // Check if contract already exists at the saved address
    if (fs.existsSync(deploymentPath)) {
        try {
            const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
            const existingAddress = deploymentData.address;

            // Check if there is code at this address on the current network
            const code = await ethers.provider.getCode(existingAddress);
            if (code !== "0x") {
                console.log(`✅ Contract already exists at ${existingAddress}. Skipping deployment.`);
                contractAddress = existingAddress;
                alreadyDeployed = true;
            } else {
                console.log("⚠️  Saved address found but no code detected (node restarted?). Redeploying...");
            }
        } catch (e) {
            console.log("⚠️  Error reading deployment.json, will deploy fresh.");
        }
    }

    if (!alreadyDeployed) {
        const LoanManagement = await ethers.getContractFactory("LoanManagement");
        const contract = await LoanManagement.deploy();
        await contract.waitForDeployment();
        contractAddress = await contract.getAddress();
        console.log("✅ LoanManagement deployed to:", contractAddress);
    }

    // Save contract address for blockchain directory
    const deploymentInfo = {
        address: contractAddress,
        deployer: deployer.address,
        network: "localhost",
        deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        deploymentPath,
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Copy ABI and Address to backend for use
    const artifactPath = path.join(
        __dirname,
        "../artifacts/contracts/LoanManagement.sol/LoanManagement.json"
    );

    if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

        const backendContractsDir = path.join(
            __dirname,
            "../../backend_loan/contracts"
        );

        if (!fs.existsSync(backendContractsDir)) {
            fs.mkdirSync(backendContractsDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(backendContractsDir, "LoanManagement.json"),
            JSON.stringify({ abi: artifact.abi, address: contractAddress }, null, 2)
        );

        console.log("📄 ABI + Address synchronized with backend_loan/contracts/");
    }

    console.log("\n🎉 Deployment complete!");
    console.log("Current Contract Address:", contractAddress);
    console.log("\n⚠️  IMPORTANT: Restart your backend server (npm start) to pick up the new address.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
