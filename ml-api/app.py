from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import numpy as np
import uvicorn
from pydantic import BaseModel
import os

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input schema
class LoanData(BaseModel):
    age: int
    annual_income: float
    credit_score: float
    existing_loans: int
    land_size_acres: float
    soil_quality: int
    requested_amount: float

# Load Model
model = None

@app.on_event("startup")
def load_model():
    global model
    try:
        model_path = "model/final_smart_agri_loan_model.cbm"
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            print("✅ Model loaded successfully.")
        else:
            print(f"⚠️ Model file not found at {model_path}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")


# ================= ML HELPER FUNCTIONS =================

def calculate_fraud_score(data: LoanData) -> float:
    """
    Calculate fraud score (0-100) based on anomaly detection.
    Higher score = more suspicious.
    """
    score = 0.0

    # Income vs Age anomaly
    if data.age < 25 and data.annual_income > 1000000:
        score += 25
    if data.age > 65 and data.annual_income > 800000:
        score += 15

    # Income vs Loan amount anomaly
    loan_to_income = data.requested_amount / max(data.annual_income, 1)
    if loan_to_income > 5:
        score += 30
    elif loan_to_income > 3:
        score += 15

    # Land size vs Loan amount anomaly
    if data.land_size_acres < 1 and data.requested_amount > 500000:
        score += 20

    # Credit score vs existing loans anomaly
    if data.credit_score > 800 and data.existing_loans > 3:
        score += 15

    # Soil quality vs land size
    if data.soil_quality < 3 and data.land_size_acres > 10:
        score += 10

    return min(round(score, 1), 100)


def calculate_default_probability(data: LoanData) -> float:
    """
    Calculate loan default probability (0-100%).
    Based on credit score, existing loans, and income-to-loan ratio.
    """
    prob = 0.0

    # Credit score impact (major factor)
    if data.credit_score < 500:
        prob += 40
    elif data.credit_score < 600:
        prob += 25
    elif data.credit_score < 700:
        prob += 15
    elif data.credit_score < 750:
        prob += 8
    else:
        prob += 3

    # Existing loans impact
    prob += min(data.existing_loans * 8, 30)

    # Income to loan ratio
    ratio = data.requested_amount / max(data.annual_income, 1)
    if ratio > 3:
        prob += 20
    elif ratio > 2:
        prob += 12
    elif ratio > 1:
        prob += 5

    # Age factor
    if data.age < 22 or data.age > 68:
        prob += 8

    # Land size (collateral)
    if data.land_size_acres < 1:
        prob += 10
    elif data.land_size_acres < 2:
        prob += 5

    return min(round(prob, 1), 100)


def calculate_risk_level(credit_score: float, fraud_score: float, default_prob: float) -> str:
    """Categorize risk as Low, Medium, or High."""
    combined = (fraud_score * 0.3) + (default_prob * 0.4) + ((900 - credit_score) / 9 * 0.3)

    if combined < 25:
        return "Low"
    elif combined < 50:
        return "Medium"
    else:
        return "High"


def suggest_interest_rate(risk_level: str, credit_score: float) -> float:
    """Suggest interest rate based on risk level and credit score."""
    base_rate = 8.5

    if risk_level == "Low":
        if credit_score > 800:
            return round(base_rate - 1.5, 1)
        return round(base_rate - 0.5, 1)
    elif risk_level == "Medium":
        return round(base_rate + 1.0, 1)
    else:  # High
        return round(base_rate + 3.0, 1)


def calculate_ml_confidence(data: LoanData, approved_amount: float) -> float:
    """Calculate ML model's confidence score (0-100%)."""
    confidence = 70.0  # base confidence

    # Higher credit score = higher confidence
    if data.credit_score > 750:
        confidence += 15
    elif data.credit_score > 650:
        confidence += 8

    # Reasonable loan-to-income ratio increases confidence
    ratio = data.requested_amount / max(data.annual_income, 1)
    if ratio < 1.5:
        confidence += 10
    elif ratio > 3:
        confidence -= 15

    # Good soil quality
    if data.soil_quality > 7:
        confidence += 5

    return min(round(confidence, 1), 99)


# ================= MAIN PREDICTION ENDPOINT =================

@app.post("/predict")
def predict(data: LoanData):
    global model

    # Calculate enhanced ML metrics
    fraud_score = calculate_fraud_score(data)
    default_prob = calculate_default_probability(data)

    # Mock response if model is missing
    if model is None:
        print("Model not found, using logic-based fallback")
        approved = 0
        if data.credit_score > 650 and data.annual_income > 100000:
            approved = data.requested_amount * 0.8

        risk_level = calculate_risk_level(data.credit_score, fraud_score, default_prob)
        interest_rate = suggest_interest_rate(risk_level, data.credit_score)
        confidence = calculate_ml_confidence(data, approved)

        return {
            "status": "success",
            "approved_amount": round(approved, 2),
            "risk_level": risk_level,
            "fraud_score": fraud_score,
            "default_probability": default_prob,
            "suggested_interest_rate": interest_rate,
            "ml_confidence": confidence,
            "note": "Model not loaded, using fallback logic"
        }

    try:
        # Convert to DataFrame
        df = pd.DataFrame([data.dict()])

        # Make prediction
        prediction = model.predict(df)[0]
        approved_amount = float(prediction)

        risk_level = calculate_risk_level(data.credit_score, fraud_score, default_prob)
        interest_rate = suggest_interest_rate(risk_level, data.credit_score)
        confidence = calculate_ml_confidence(data, approved_amount)

        return {
            "status": "success",
            "approved_amount": round(approved_amount, 2),
            "risk_level": risk_level,
            "fraud_score": fraud_score,
            "default_probability": default_prob,
            "suggested_interest_rate": interest_rate,
            "ml_confidence": confidence,
        }
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ================= ADDITIONAL ENDPOINTS =================

@app.post("/fraud-check")
def fraud_check(data: LoanData):
    """Standalone fraud detection endpoint."""
    score = calculate_fraud_score(data)
    level = "Low" if score < 25 else ("Medium" if score < 50 else "High")
    return {
        "fraud_score": score,
        "fraud_level": level,
        "flags": []
    }

@app.post("/risk-categorize")
def risk_categorize(data: LoanData):
    """Standalone risk categorization endpoint."""
    fraud = calculate_fraud_score(data)
    default_prob = calculate_default_probability(data)
    risk = calculate_risk_level(data.credit_score, fraud, default_prob)
    rate = suggest_interest_rate(risk, data.credit_score)

    return {
        "risk_level": risk,
        "fraud_score": fraud,
        "default_probability": default_prob,
        "suggested_interest_rate": rate,
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
