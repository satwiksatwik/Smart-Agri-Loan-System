!pip install catboost
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from catboost import CatBoostRegressor
import joblib

# ============================================================
# 1️⃣ LOAD DATASET
# ============================================================

file_path = "/content/Agriculture_Loan_Dataset_10000_Records_FinalApproved.csv"
df = pd.read_csv(file_path)

print("✅ Dataset Loaded")
print("Shape:", df.shape)

# ============================================================
# 2️⃣ DEFINE CATEGORICAL COLUMNS
# ============================================================

cat_cols = [
    "Land_Location",
    "Irrigation_Facility",
    "Loan_Purpose",
    "Loan_Type",
    "Land_Ownership",
    "Loan_History"
]

# ============================================================
# 3️⃣ TRAIN LOAN MODEL (Only ML Model Needed)
# ============================================================

TARGET = "Approved_Loan_Amount"

X = df.drop(columns=[TARGET])
y = df[TARGET]

for col in cat_cols:
    X[col] = X[col].astype(str)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

cat_features = [X.columns.get_loc(col) for col in cat_cols]

loan_model = CatBoostRegressor(
    iterations=500,
    depth=6,
    learning_rate=0.05,
    loss_function="RMSE",
    random_seed=42,
    verbose=100
)

loan_model.fit(X_train, y_train, cat_features=cat_features)

print("\n📊 LOAN MODEL PERFORMANCE")

y_pred = loan_model.predict(X_test)

print("MAE  :", round(mean_absolute_error(y_test, y_pred), 2))
print("RMSE :", round(np.sqrt(mean_squared_error(y_test, y_pred)), 2))
print("R²   :", round(r2_score(y_test, y_pred), 4))

# ============================================================
# 4️⃣ RULE-BASED CREDIT SCORE
# ============================================================

def calculate_credit_score(input_data):

    score = 300

    # Income Impact
    if input_data["Annual_Income"] >= 600000:
        score += 200
    elif input_data["Annual_Income"] >= 400000:
        score += 150
    elif input_data["Annual_Income"] >= 250000:
        score += 100
    else:
        score += 50

    # Existing Loans
    if input_data["Existing_Loans"] == 0:
        score += 100
    elif input_data["Existing_Loans"] == 1:
        score += 50
    elif input_data["Existing_Loans"] == 2:
        score -= 50
    else:
        score -= 150

    # Loan History
    if input_data["Loan_History"] == "Repeat":
        score += 100
    else:
        score += 20

    # Land Ownership
    if input_data["Land_Ownership"] == "Owned":
        score += 80
    else:
        score += 20

    # Land Size
    if input_data["Land_Size_Acres"] >= 5:
        score += 70
    elif input_data["Land_Size_Acres"] >= 2:
        score += 40
    else:
        score += 20

    # Age Stability
    if 30 <= input_data["Age_of_Farmer"] <= 55:
        score += 50
    else:
        score += 20

    return max(300, min(int(score), 850))

# ============================================================
# 5️⃣ RULE VALIDATION
# ============================================================

def rule_validation(data):

    BUFFER = 50000

    if data["Land_Ownership"] == "Leased":
        return False, "Land is leased"

    if data["Annual_Income"] < (data["Requested_Loan_Amount"] + BUFFER):
        return False, "Income insufficient"

    if data["Credit_Score"] < 620:
        return False, "Credit score below 620"

    if data["Existing_Loans"] >= 3:
        return False, "Too many existing loans"

    return True, "Eligible"

# ============================================================
# 6️⃣ LOYALTY ADJUSTMENT
# ============================================================

def loyalty_adjustment(predicted_amount, data):

    requested = data["Requested_Loan_Amount"]
    credit = data["Credit_Score"]
    existing = data["Existing_Loans"]

    if data["Loan_History"] == "First_Time":
        return min(predicted_amount * 0.95, requested)

    if existing > 1:
        return min(predicted_amount, requested)

    if credit >= 751:
        predicted_amount *= 1.05
    elif credit >= 681:
        predicted_amount *= 1.03

    return min(predicted_amount, requested)

# ============================================================
# 7️⃣ FINAL PREDICTION FUNCTION
# ============================================================

def predict_loan(input_data):

    # Step 1: Calculate Credit Score
    credit_score = calculate_credit_score(input_data)
    input_data["Credit_Score"] = credit_score

    # Step 2: Rule Validation
    is_valid, message = rule_validation(input_data)

    if not is_valid:
        return {
            "status": "Rejected",
            "reason": message,
            "credit_score": credit_score,
            "approved_amount": 0
        }

    # Step 3: ML Loan Prediction
    input_df = pd.DataFrame([input_data])
    for col in cat_cols:
        input_df[col] = input_df[col].astype(str)

    base_amount = loan_model.predict(input_df)[0]

    # Step 4: Loyalty Adjustment
    final_amount = loyalty_adjustment(base_amount, input_data)

    return {
        "status": "Approved",
        "credit_score": credit_score,
        "approved_amount": round(final_amount, 2)
    }

# ============================================================
# 8️⃣ SAVE MODEL
# ============================================================

loan_model.save_model("final_loan_model.cbm")
joblib.dump(loan_model, "final_loan_model.pkl")

print("\n✅ System Ready for Frontend Integration")