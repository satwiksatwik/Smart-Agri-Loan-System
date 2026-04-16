# 🌾 Smart Agriculture Loan System

A full-stack agricultural loan management platform that combines **Machine Learning**, **Blockchain**, and modern web technologies to digitize and streamline the farm loan lifecycle — from application to EMI repayment.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [User Roles & Portals](#user-roles--portals)
- [Blockchain Integration](#blockchain-integration)
- [ML Credit Risk Engine](#ml-credit-risk-engine)
- [Security](#security)

---

## Overview

The **Smart Agriculture Loan System** enables farmers to apply for agricultural loans online, while bank managers review, approve, or reject applications through a dedicated portal. Every critical action — loan creation, approval, rejection, and EMI payment — is recorded on a local Ethereum blockchain for tamper-proof auditability.

An integrated **ML-powered credit risk engine** (CatBoost model served via FastAPI) automatically assesses each application's risk level, fraud score, default probability, and suggests an appropriate interest rate.

---

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│   React.js       │────▶│   Express.js     │────▶│   MongoDB        │
│   (Frontend)     │     │   (Backend API)  │     │   (Database)     │
│   Port 3000      │     │   Port 5001      │     │   Atlas / Local  │
│                  │     │                  │     │                  │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
              │  FastAPI   │ │Hardhat  │ │ Nodemailer  │
              │  ML API    │ │Ethereum │ │ Email       │
              │  Port 8000 │ │Port 8545│ │ Service     │
              └───────────┘ └─────────┘ └─────────────┘
```

---

## Key Features

### 👨‍🌾 Farmer Portal
- **OTP-based Registration** — Email verification with 6-digit OTP
- **Loan Application** — Multi-step form with document uploads (Aadhaar, PAN, Adangal, Income Certificate, Soil Health Card, Photo)
- **ML Credit Assessment** — Real-time credit score, risk level, fraud detection, and approved amount prediction
- **Loan Status Tracking** — View application status with blockchain transaction hashes
- **EMI Calculator** — Standalone EMI calculator with full amortization schedule
- **Repayment Tracking** — View EMI schedule with due dates, pay online (UPI/Card/NetBanking), or request offline verification
- **Smart EMI Alerts** — 7-day reminders for upcoming dues, overdue notifications
- **Profile Management** — Update personal details and upload permanent documents

### 🏦 Bank Manager Portal
- **Dedicated Registration & Login** — Separate authentication flow with Employee ID, Bank Name, and Branch
- **Analytics Dashboard** — Total loans, approval rates, monthly trends (charts via Recharts), loan type & risk distribution
- **Loan Review** — Detailed view of each application with farmer documents, ML risk analysis, and blockchain audit trail
- **Approve / Reject** — Set approved amount, interest rate, and tenure; auto-generates EMI schedule with due dates
- **EMI Payment Approval** — Review and approve/reject farmer EMI payments (online & offline)
- **PDF Report Generation** — Download comprehensive loan reports as PDF (PDFKit)
- **Blockchain Explorer** — View all on-chain transaction history

### 🛡️ Admin Portal
- **System Oversight** — Full admin dashboard with system-wide statistics
- **Manager & Admin account management**

### ⛓️ Blockchain (Ethereum / Hardhat)
- Loan creation, approval, and rejection recorded on-chain
- EMI repayments logged with transaction hashes
- Immutable audit trail for every financial action
- Smart contract: `LoanManagement.sol` (Solidity 0.8.20)

### 🤖 ML Credit Risk Engine
- **CatBoost model** trained on agricultural loan dataset
- Predicts: Approved Amount, Risk Level (Low/Medium/High), Fraud Score, Default Probability
- Suggests interest rate based on risk profile
- Fallback logic when model is unavailable
- Additional endpoints: `/fraud-check`, `/risk-categorize`, `/health`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Tailwind CSS 3, React Router 6, Recharts, Lucide Icons, Axios |
| **Backend** | Node.js, Express 4, Mongoose, JWT, Multer, PDFKit, Nodemailer |
| **Database** | MongoDB (Atlas or Local) |
| **Blockchain** | Solidity 0.8.20, Hardhat, Ethers.js 6 |
| **ML API** | Python, FastAPI, CatBoost, scikit-learn, Pandas, NumPy |
| **Security** | Helmet, CORS, Rate Limiting, XSS Clean, Mongo Sanitize, HPP, bcrypt |

---

## Project Structure

```
Smart-Agri-Loan-System/
├── backend_loan/                 # Express.js API Server
│   ├── config/                   # Database connection
│   ├── controllers/              # Business logic
│   │   ├── emiController.js      # EMI calculation, payments, alerts
│   │   ├── loanController.js     # Loan CRUD with ML integration
│   │   └── managerController.js  # Manager dashboard, approve/reject, PDF
│   ├── middleware/               # Auth, error handling, security
│   ├── models/                   # Mongoose schemas
│   │   ├── AuditLog.js           # Blockchain audit trail model
│   │   ├── Loan.js               # Loan + Repayment schema
│   │   ├── Otp.js                # OTP verification model
│   │   └── User.js               # User model (farmer/manager/admin)
│   ├── routes/                   # API route definitions
│   │   ├── adminRoutes.js        # Admin endpoints
│   │   ├── auditRoutes.js        # Audit log endpoints
│   │   ├── authRoutes.js         # Registration, login, OTP
│   │   ├── emiRoutes.js          # EMI payment endpoints
│   │   ├── loanRoutes.js         # Loan application endpoints
│   │   └── managerRoutes.js      # Manager portal endpoints
│   ├── services/                 # Blockchain service layer
│   ├── utils/                    # Email transporter, helpers
│   ├── contracts/                # Auto-synced ABI from blockchain
│   ├── uploads/                  # Uploaded documents (gitignored)
│   ├── .env.example              # Environment variable template
│   ├── server.js                 # Entry point
│   └── package.json
│
├── frontend_loan/                # React.js Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js         # Dynamic navbar (farmer/manager modes)
│   │   │   ├── Modal.js          # Reusable modal component
│   │   │   ├── Input.js          # Styled input component
│   │   │   └── OTPInput.js       # 6-digit OTP input
│   │   ├── context/              # Auth & Admin auth providers
│   │   ├── pages/
│   │   │   ├── LandingPage.js    # Public landing page
│   │   │   ├── RegisterPage.js   # Farmer registration with OTP
│   │   │   ├── LoginPage.js      # Farmer login
│   │   │   ├── Dashboard.js      # Farmer dashboard
│   │   │   ├── LoanApplication.js# Multi-step loan application
│   │   │   ├── LoanStatus.js     # Loan status tracking
│   │   │   ├── RepaymentTracking.js # EMI schedule & payments
│   │   │   ├── EMICalculator.js  # Standalone EMI calculator
│   │   │   ├── ProfilePage.js    # User profile management
│   │   │   ├── AdminLoginPage.js # Manager/Admin login
│   │   │   ├── AdminRegisterPage.js # Manager registration
│   │   │   ├── AdminDashboard.js # Admin overview
│   │   │   ├── ManagerDashboard.js # Manager analytics & loan list
│   │   │   └── ManagerLoanDetail.js # Loan review & approval
│   │   └── App.js                # Routing & auth guards
│   ├── tailwind.config.js
│   └── package.json
│
├── blockchain/                   # Ethereum Smart Contracts
│   ├── contracts/
│   │   └── LoanManagement.sol    # Main smart contract
│   ├── scripts/
│   │   └── deploy.js             # Deployment script (idempotent)
│   ├── hardhat.config.js
│   └── package.json
│
├── ml-api/                       # FastAPI ML Server
│   ├── app.py                    # Prediction, fraud check, risk endpoints
│   ├── predict.py                # Prediction helper
│   ├── model/                    # Trained CatBoost model (.cbm)
│   └── requirements.txt
│
├── ml-training/                  # Model Training
│   ├── AGRI_dataset.csv          # Training dataset
│   ├── train_model.py            # CatBoost training script
│   ├── final_loan_model.cbm      # Trained model (CatBoost)
│   └── final_loan_model.pkl      # Trained model (pickle)
│
└── .gitignore
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | v16 or higher |
| **Python** | v3.8 or higher |
| **MongoDB** | Local instance or MongoDB Atlas account |
| **npm** | v8 or higher |

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/satwiksatwik/Smart-Agri-Loan-System.git
cd Smart-Agri-Loan-System
```

### 2. Backend Setup

```bash
cd backend_loan
npm install
```

Create a `.env` file in `backend_loan/` (see [Environment Variables](#environment-variables)):

```bash
cp .env.example .env
# Edit .env with your actual credentials
```

Start the backend server:

```bash
npm start
```

> Server runs on **http://localhost:5001**

### 3. Blockchain Setup

Open a **new terminal** and start the Hardhat local node:

```bash
cd blockchain
npm install
npx hardhat node
```

> Keep this terminal running. The local Ethereum node runs on **http://127.0.0.1:8545**

Open another **new terminal** and deploy the smart contract:

```bash
cd blockchain
npm run deploy
```

> This compiles and deploys `LoanManagement.sol`, then auto-syncs the ABI and contract address to `backend_loan/contracts/`.

> **Note:** After deploying, restart the backend server to pick up the new contract address.

### 4. ML API Setup

```bash
cd ml-api
pip install -r requirements.txt
python app.py
```

> FastAPI server runs on **http://127.0.0.1:8000**
>
> Health check: `GET http://127.0.0.1:8000/health`

### 5. Frontend Setup

```bash
cd frontend_loan
npm install
npm start
```

> React app runs on **http://localhost:3000**

### 6. Create Admin Account (First-Time Setup)

```bash
cd backend_loan
node createAdmin.js
```

> This creates a default admin account for system management.

---

## Environment Variables

Create a `.env` file in `backend_loan/` based on `.env.example`:

```env
# Server
PORT=5001

# MongoDB Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT Secret Key
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# ML API
ML_API_URL=http://127.0.0.1:8000/predict
```

> **Note:** The `BLOCKCHAIN_PRIVATE_KEY` above is the default Hardhat account #0 private key (for local development only). Never use this in production.

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| POST | `/api/auth/register` | Complete farmer registration |
| POST | `/api/auth/login` | Farmer login |
| POST | `/api/auth/admin/register` | Manager registration |
| POST | `/api/auth/admin/login` | Manager/Admin login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |

### Loans (`/api/loan`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/loan/apply` | Submit loan application (with document uploads) |
| GET | `/api/loan/my-loans` | Get farmer's own loans |
| GET | `/api/loan/:id` | Get loan details |

### Manager (`/api/manager`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/manager/dashboard` | Dashboard analytics |
| GET | `/api/manager/loans` | All loans (filterable by status) |
| GET | `/api/manager/loan/:id` | Loan detail with audit trail |
| PUT | `/api/manager/loan/:id/approve` | Approve loan |
| PUT | `/api/manager/loan/:id/reject` | Reject loan |
| GET | `/api/manager/loan/:id/pdf` | Generate PDF report |
| GET | `/api/manager/blockchain/transactions` | Blockchain transaction history |
| GET | `/api/manager/document/:filename` | View uploaded document |
| GET | `/api/manager/pending-emis` | Pending EMI payments |
| PUT | `/api/manager/emi/:loanId/approve` | Approve EMI payment |
| PUT | `/api/manager/emi/:loanId/reject` | Reject EMI payment |

### EMI (`/api/emi`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emi/calculate` | Calculate EMI with amortization |
| GET | `/api/emi/schedule/:loanId` | Get loan's EMI schedule |
| POST | `/api/emi/pay/:loanId` | Initiate online EMI payment |
| POST | `/api/emi/verify/:loanId` | Request offline verification |
| GET | `/api/emi/alerts` | Get 7-day EMI reminders |
| GET | `/api/emi/history/:loanId` | Get repayment history |

### Audit (`/api/audit`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/logs` | Get audit logs |

### ML API (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Full credit risk prediction |
| POST | `/fraud-check` | Standalone fraud detection |
| POST | `/risk-categorize` | Risk categorization |
| GET | `/health` | Health check & model status |

---

## User Roles & Portals

| Role | Portal | Access |
|------|--------|--------|
| **Farmer** (`user`) | `/dashboard` | Apply for loans, track status, pay EMIs, view profile |
| **Bank Manager** (`bank_manager`) | `/manager/dashboard` | Review loans, approve/reject, manage EMI payments, view blockchain logs |
| **Admin** (`admin`) | `/admin/dashboard` | System-wide administration and oversight |

### Registration Flow

- **Farmers** → `/register` → Email OTP verification → Set username & password
- **Bank Managers** → `/admin/register` → Employee ID, Bank Name, Branch → Email & password

---

## Blockchain Integration

The system uses a **Solidity smart contract** (`LoanManagement.sol`) deployed on a local Hardhat Ethereum network.

### On-Chain Actions

| Action | Event Emitted | When |
|--------|--------------|------|
| `createLoan()` | `LoanCreated` | Loan application submitted for review |
| `approveLoan()` | `LoanApproved` | Manager approves a loan |
| `rejectLoan()` | `LoanRejected` | Manager rejects a loan |
| `recordRepayment()` | `EMIRecorded` | Manager approves an EMI payment |

### Data Stored On-Chain

- Loan ID, borrower name, application number, amount, credit score, loan type
- Interest rate, approval/rejection status, rejection reason
- Repayment records (amount, EMI number, timestamp)
- Full transaction log with action type and details

---

## ML Credit Risk Engine

### Model Details

- **Algorithm**: CatBoost (Gradient Boosting)
- **Training Data**: `AGRI_dataset.csv` (~10,000 records)
- **Input Features**: Age, Annual Income, Credit Score, Existing Loans, Land Size, Soil Quality, Requested Amount

### Prediction Output

| Field | Description |
|-------|-------------|
| `approved_amount` | ML-predicted approved loan amount |
| `risk_level` | Low / Medium / High |
| `fraud_score` | 0–100 (anomaly-based fraud detection) |
| `default_probability` | 0–100% (likelihood of loan default) |
| `suggested_interest_rate` | Risk-adjusted interest rate suggestion |
| `ml_confidence` | Model confidence score (0–99%) |

---

## Security

The backend implements multiple security layers:

- **Helmet** — HTTP security headers
- **CORS** — Cross-origin resource sharing
- **Rate Limiting** — 200 req/15min (global), 20 req/15min (auth)
- **XSS Clean** — Cross-site scripting prevention
- **Mongo Sanitize** — NoSQL injection prevention
- **HPP** — HTTP parameter pollution protection
- **bcrypt** — Password hashing (salt rounds: 10)
- **JWT** — Token-based authentication
- **Multer** — Secure file upload handling

---

## Running All Services

You need **4 terminals** running simultaneously:

| Terminal | Command | Port |
|----------|---------|------|
| 1 | `cd blockchain && npx hardhat node` | 8545 |
| 2 | `cd blockchain && npm run deploy` (one-time) | — |
| 3 | `cd ml-api && python app.py` | 8000 |
| 4 | `cd backend_loan && npm start` | 5001 |
| 5 | `cd frontend_loan && npm start` | 3000 |

---

## License

ISC
