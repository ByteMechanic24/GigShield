import os
import json
import math
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for pure dev integrations flawlessly 
CORS(app)

# Module-level model state parameters locally tracking file structures 
PWD = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(PWD, "models")

PREMIUM_MODEL_PATH = os.path.join(MODELS_DIR, "xgboost_premium.pkl")
FRAUD_MODEL_PATH = os.path.join(MODELS_DIR, "isolation_forest.pkl")
PREMIUM_FEATURES_PATH = os.path.join(MODELS_DIR, "premium_feature_names.json")

premium_model = None
fraud_model = None
premium_features = None

def load_models():
    global premium_model, fraud_model, premium_features
    print("--- GigShield ML Application Booting Mapping ---")
    
    if os.path.exists(PREMIUM_MODEL_PATH):
        try:
            premium_model = joblib.load(PREMIUM_MODEL_PATH)
            print("INFO: XGBoost Premium tracking mapping natively loaded successfully.")
        except Exception as e:
            print(f"WARN: Failed bounding XGBoost parameters structurally cleanly -> {e}")
    else:
        print("WARN: XGBoost model missing structurally defaulting explicitly to logic.")

    if os.path.exists(FRAUD_MODEL_PATH):
        try:
            fraud_model = joblib.load(FRAUD_MODEL_PATH)
            print("INFO: Isolation Forest anomaly limits fully deployed natively.")
        except Exception as e:
            print(f"WARN: Isolation Forest boundary mappings failed cleanly -> {e}")
    else:
        print("WARN: Scikit limits omitted defaulting safely dynamically.")

    if os.path.exists(PREMIUM_FEATURES_PATH):
        try:
            with open(PREMIUM_FEATURES_PATH, 'r') as f:
                premium_features = json.load(f)
        except Exception as e:
            print(f"WARN: Premium payload boundaries omitted globally -> {e}")

load_models()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "premium_model_loaded": premium_model is not None,
        "fraud_model_loaded": fraud_model is not None,
        "version": "1.0.0"
    })

@app.route('/model-info', methods=['GET'])
def model_info():
    info = {"premium_model": False, "fraud_model": False}
    if premium_model is not None and premium_features is not None:
        try:
            importances = premium_model.feature_importances_
            info["premium_feature_importances"] = dict(zip(premium_features, [float(i) for i in importances]))
            info["premium_model"] = True
        except Exception:
            pass
            
    if fraud_model is not None:
         # IsolationForest extraction mapping securely bounding structural definitions  
         info["fraud_contamination_rate"] = getattr(fraud_model, 'contamination', 'unknown')
         info["fraud_model"] = True
         
    return jsonify(info)

@app.route('/predict/premium', methods=['POST'])
def predict_premium():
    body = request.get_json() or {}
    
    # Establish local parametric safety boundaries smoothly resolving cleanly
    try:
        features = {
            'zone_disruption_rate_90d': float(body.get('zone_disruption_rate_90d', 1.0)),
            'zone_flood_risk_score': float(body.get('zone_flood_risk_score', 0.5)),
            'weather_forecast_7d_risk': float(body.get('weather_forecast_7d_risk', 0.0)),
            'seasonal_factor': float(body.get('seasonal_factor', 1.0)),
            'worker_claim_history_ratio': float(body.get('worker_claim_history_ratio', 0.8)),
            'city_baseline_rate': float(body.get('city_baseline_rate', 35.0))
        }
    except ValueError:
        return jsonify({"error": "Payload mappings structurally failed strictly bounds"}), 400

    for k, v in features.items():
        if not math.isfinite(v):
            return jsonify({"error": f"Payload boundaries require strictly finite mappings seamlessly for {k}"}), 422

    if premium_model is None or premium_features is None:
        # Fallback explicitly structurally mapped dynamically limiting execution logic
        weekly_premium = features['city_baseline_rate'] + (features['zone_disruption_rate_90d'] * 4.5) + (features['zone_flood_risk_score'] * 8)
        weekly_premium = max(25.0, min(80.0, weekly_premium))
        return jsonify({"premium": round(weekly_premium, 2), "model_available": False})
        
    try:
        df = pd.DataFrame([features])
        # Re-map sequences consistently tracking natively  
        if all(feat in df.columns for feat in premium_features):
            df = df[premium_features]
            
        pred = premium_model.predict(df)[0]
        # Standardize executions dynamically bounding safety limits seamlessly
        weekly_premium = max(25.0, min(80.0, float(pred)))
        
        return jsonify({"premium": round(weekly_premium, 2), "model_available": True})
    except Exception as e:
        return jsonify({"error": f"Prediction Exception execution mapping locally -> {str(e)}"}), 500

@app.route('/predict/fraud-score', methods=['POST'])
def predict_fraud():
    body = request.get_json() or {}
    
    try:
        features = {
            'claims_last_30d': float(body.get('claims_last_30d', 0)),
            'claims_per_peer_ratio': float(body.get('claims_per_peer_ratio', 1.0)),
            'days_since_enrollment': float(body.get('days_since_enrollment', 365)),
            'enrollment_days_before_storm': float(body.get('enrollment_days_before_storm', 999)),
            'device_account_count': float(body.get('device_account_count', 1)),
            'gps_trajectory_variance': float(body.get('gps_trajectory_variance', 0.1)),
            'route_type_match': float(body.get('route_type_match', 0.8)),
            'platform_gps_divergence': float(body.get('platform_gps_divergence', 100))
        }
    except ValueError:
         return jsonify({"error": "Payload mappings structurally failed strictly bounds"}), 400
         
    for k, v in features.items():
        if not math.isfinite(v):
            return jsonify({"error": f"Payload boundaries require strictly finite mappings seamlessly for {k}"}), 422

    if fraud_model is None:
        score = 1.0
        if features['device_account_count'] > 1: score -= 0.4
        if features['enrollment_days_before_storm'] < 3: score -= 0.3
        if features['claims_per_peer_ratio'] > 3: score -= 0.25
        return jsonify({"fraudScore": max(0.0, score), "model_available": False})
        
    try:
        # Strict mapping structural limits
        feature_order = [
            'claims_last_30d', 'claims_per_peer_ratio', 'days_since_enrollment', 
            'enrollment_days_before_storm', 'device_account_count', 
            'gps_trajectory_variance', 'route_type_match', 'platform_gps_divergence'
        ]
        
        df = pd.DataFrame([features])[feature_order]
        
        # Pull decision_function natively yielding bounded parameters 
        raw_score = float(fraud_model.decision_function(df)[0])
        
        # Scikit-learn outputs from roughly -0.5 to 0.5. Reproject structural normalization into exactly [0, 1].
        normalized_score = max(0.0, min(1.0, raw_score + 0.5))
        
        return jsonify({"fraudScore": round(normalized_score, 4), "model_available": True})
    except Exception as e:
        return jsonify({"error": f"Forest Anomaly Extraction locally executing mappings naturally blocked -> {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)
