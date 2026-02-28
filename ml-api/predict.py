import joblib
import pandas as pd
import sys
import json

# Load trained model
model = joblib.load("../ml-training/loan_model.pkl")

# Get JSON input from Node
input_json = sys.argv[1]
input_data = json.loads(input_json)

# Convert to DataFrame
input_df = pd.DataFrame([input_data])

# Predict
prediction = model.predict(input_df)[0]

print(float(prediction))