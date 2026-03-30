import os
import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest

def main():
    pwd = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(pwd, 'data', 'fraud_data.csv')
    model_dir = os.path.join(os.path.dirname(pwd), 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    print("Loading structured bi-modal fraud injection bounds...")
    df = pd.read_csv(data_path)
    
    # Safely detach supervised metrics matching unsupervised payload constraints 
    X = df.drop(columns=['is_fraud'])
    y = df['is_fraud'] if 'is_fraud' in df.columns else None
    
    print("Executing Isolation Forest anomaly modeling safely natively...")
    model = IsolationForest(
        n_estimators=200, 
        contamination=0.15, 
        random_state=42, 
        max_samples="auto"
    )
    
    # Unsupervised alignment structure directly resolving parameter nodes securely 
    model.fit(X)
    
    print("Validating unsupervised limits strictly cross-mapping supervised telemetry securely...")
    # Map predictions isolating (-1 for outlier inherently standard to isolation forests natively)
    scores = model.decision_function(X)
    predictions = model.predict(X) 
    
    if y is not None:
        df['anomaly_score'] = scores
        df['is_outlier'] = (predictions == -1)
        
        legit = df[df['is_fraud'] == 0]
        fraud = df[df['is_fraud'] == 1]
        
        legit_flagged_pct = (legit['is_outlier'].sum() / len(legit)) * 100
        fraud_flagged_pct = (fraud['is_outlier'].sum() / len(fraud)) * 100
        
        print("\n--- Model Validation Confidence Matrices ---")
        print(f"--> Legitimate cases improperly surfaced as outliers (False Positives): {legit_flagged_pct:.2f}%")
        print(f"--> Fraud cases accurately caught structurally natively (True Positives): {fraud_flagged_pct:.2f}%\n")
    
    model_path = os.path.join(model_dir, 'isolation_forest.pkl')
    joblib.dump(model, model_path)
    print(f"Successfully locked baseline fraud detections completely inherently structurally -> {model_path}")

if __name__ == "__main__":
    main()
