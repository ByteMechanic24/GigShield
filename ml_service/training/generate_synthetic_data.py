import os
import numpy as np
import pandas as pd

def generate_premium_training_data(n_samples=2000) -> pd.DataFrame:
    """
    Generates deterministic but normally dispersed mock data
    driving XGBoost Premium mapping integrations.
    """
    np.random.seed(42) # Ensuring deterministic reproducibility
    
    # Generate bounded uniform parameter sweeps
    zone_disruption_rate_90d = np.random.uniform(0.2, 3.5, n_samples)
    zone_flood_risk_score = np.random.uniform(0.1, 0.95, n_samples)
    weather_forecast_7d_risk = np.random.uniform(0.0, 1.0, n_samples)
    
    # Establish structural seasonal parameters tracking explicitly
    months = np.random.randint(1, 13, n_samples)
    seasonal_factor = np.where(
        np.isin(months, [6, 7, 8, 9]), 1.4,
        np.where(np.isin(months, [11, 12, 1, 2]), 0.8, 1.0)
    )
    
    # Generate localized history metrics mapped safely
    worker_claim_history_ratio = np.clip(np.random.normal(0.8, 0.4, n_samples), 0.1, 2.5)
    
    # City bounds simulating Mumbai (38), Delhi/BLR (35), Tier-2 (30) mapped 40/40/20 natively
    city_baseline_rate = np.random.choice([38, 35, 30], n_samples, p=[0.4, 0.4, 0.2])
    
    # Construct base formula injecting local noise safely
    noise = np.random.normal(0, 3, n_samples)
    target_premium = (
        city_baseline_rate + 
        (zone_disruption_rate_90d * 4.5) + 
        (zone_flood_risk_score * 8) + 
        (weather_forecast_7d_risk * 6) + 
        (seasonal_factor * 3) + 
        (worker_claim_history_ratio * 2) + 
        noise
    )
    
    # Bound the target functionally across structural limits efficiently
    target_premium = np.clip(target_premium, 25, 80)
    
    df = pd.DataFrame({
        'zone_disruption_rate_90d': zone_disruption_rate_90d,
        'zone_flood_risk_score': zone_flood_risk_score,
        'weather_forecast_7d_risk': weather_forecast_7d_risk,
        'seasonal_factor': seasonal_factor,
        'worker_claim_history_ratio': worker_claim_history_ratio,
        'city_baseline_rate': city_baseline_rate,
        'target_premium': target_premium
    })
    
    return df

def generate_fraud_training_data(n_samples=3000) -> pd.DataFrame:
    """
    Generates targeted bi-modal mapping simulating isolated spoof vs legitimate bounds natively.
    """
    np.random.seed(42)
    
    n_fraud = int(n_samples * 0.15)
    n_legit = n_samples - n_fraud
    
    # Create legitimate population baseline properties
    df_legit = pd.DataFrame({
        'claims_last_30d': np.random.randint(0, 6, n_legit),
        'claims_per_peer_ratio': np.random.uniform(0.3, 1.8, n_legit),
        'days_since_enrollment': np.random.randint(14, 366, n_legit),
        'enrollment_days_before_storm': np.random.randint(30, 1000, n_legit),
        'device_account_count': np.full(n_legit, 1),
        'gps_trajectory_variance': np.random.uniform(0.05, 0.3, n_legit),
        'route_type_match': np.random.uniform(0.6, 1.0, n_legit),
        'platform_gps_divergence': np.random.uniform(50, 400, n_legit),
        'is_fraud': np.zeros(n_legit, dtype=int)
    })
    
    # Simulate anomalous fraud properties modeling organized spoof structures
    df_fraud = pd.DataFrame({
        'claims_last_30d': np.random.randint(5, 21, n_fraud),
        'claims_per_peer_ratio': np.random.uniform(2.5, 8.0, n_fraud),
        'days_since_enrollment': np.random.randint(0, 11, n_fraud),
        'enrollment_days_before_storm': np.random.randint(0, 4, n_fraud),
        'device_account_count': np.random.randint(1, 5, n_fraud),
        'gps_trajectory_variance': np.random.uniform(0.0, 0.05, n_fraud),
        'route_type_match': np.random.uniform(0.2, 0.7, n_fraud),
        'platform_gps_divergence': np.random.uniform(1000, 8000, n_fraud),
        'is_fraud': np.ones(n_fraud, dtype=int)
    })
    
    # Concat and locally shuffle cleanly natively returning data frame efficiently 
    df = pd.concat([df_legit, df_fraud], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    return df

if __name__ == "__main__":
    pwd = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(pwd, 'data')
    os.makedirs(output_dir, exist_ok=True)
    
    # Execution block mapping dataset generations 
    print("Executing Premium Pricing Structural Set generation...")
    premium_df = generate_premium_training_data()
    premium_path = os.path.join(output_dir, 'premium_data.csv')
    premium_df.to_csv(premium_path, index=False)
    print(f"--> Saved {len(premium_df)} premium records to {premium_path}")
    print(premium_df.describe().T[['mean', 'min', 'max']])
    print("\n----------------------------------------------------\n")
    
    print("Executing Organized Fraud Bi-modal Set generation...")
    fraud_df = generate_fraud_training_data()
    fraud_path = os.path.join(output_dir, 'fraud_data.csv')
    fraud_df.to_csv(fraud_path, index=False)
    print(f"--> Saved {len(fraud_df)} fraud records to {fraud_path}")
    print(fraud_df.groupby('is_fraud').mean().T)
    print("\nDone.")
