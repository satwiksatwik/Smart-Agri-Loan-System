# Smart Agriculture Loan System

## Overview
This project is a comprehensive loan management system for farmers, featuring:
- **Frontend**: React.js with Tailwind CSS (User & Admin Dashboards).
- **Backend**: Node.js & Express (API, Auth, File Uploads).
- **ML API**: FastAPI with CatBoost (Credit Risk Assessment).
- **Database**: MongoDB.

## Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB (Local or Atlas)

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart_agri_loan
JWT_SECRET=your_secret_key
ML_API_URL=http://127.0.0.1:8000/predict
```
Start the server:
```bash
npm start
```

### 2. ML API Setup
```bash
cd ml-api
pip install -r requirements.txt
```
Start the FastAPI server:
```bash
python app.py
```
(Runs on http://127.0.0.1:8000)

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Start the React app:
```bash
npm start
```
(Runs on http://localhost:3000)

## Features
- **User**: Register/Login, Apply for Loan (with file uploads), View Status.
- **Admin**: View all loans, Approve/Reject loans (accessible via `/admin/dashboard` - ensure user role is 'admin' in DB).
- **ML**: Automatically predicts loan approval probability based on credit score, land details, and income.

## Deployment
- **Frontend**: Build using `npm run build`.
- **Backend**: Use `pm2` or Docker.
- **ML API**: Use `gunicorn` with `uvicorn` workers.
