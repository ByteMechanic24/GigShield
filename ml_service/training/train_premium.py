import os
import json
import joblib
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

def main():
    # Construct isolated workspace paths safely mapping integrations
    pwd = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(pwd, 'data', 'premium_data.csv')
    model_dir = os.path.join(os.path.dirname(pwd), 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    print("Loading synthetic premium data...")
    df = pd.read_csv(data_path)
    
    # Partition structured bounds exclusively tracking explicit outputs mapping natively 
    X = df.drop(columns=['target_premium'])
    y = df['target_premium']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Regressor cleanly across bounds...")
    model = XGBRegressor(
        n_estimators=200, 
        max_depth=5, 
        learning_rate=0.1, 
        subsample=0.8, 
        colsample_bytree=0.8, 
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    print("Evaluating Model execution outputs...")
    predictions = model.predict(X_test)
    rmse = mean_squared_error(y_test, predictions, squared=False)
    r2 = r2_score(y_test, predictions)
    
    print(f"--> Premium Model Root Mean Square Error (RMSE): {rmse:.4f}")
    print(f"--> Premium Model R-squared (R2): {r2:.4f}")
    
    # Save Model natively via Joblib pipeline bindings cleanly 
    model_path = os.path.join(model_dir, 'xgboost_premium.pkl')
    joblib.dump(model, model_path)
    
    # Lock feature limits for inference validations cleanly internally 
    features_path = os.path.join(model_dir, 'premium_feature_names.json')
    with open(features_path, 'w') as f:
        json.dump(list(X.columns), f)
        
    print(f"Successfully saved bounds definitively at -> {model_path}")

if __name__ == "__main__":
    main()
