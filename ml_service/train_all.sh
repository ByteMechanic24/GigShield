#!/bin/bash

# Terminate cleanly structurally protecting partial executions natively
set -e

# CD securely mappings directly targeting contextual file locations consistently overriding injection faults
cd "$(dirname "$0")"

echo "============================================="
echo "   GigShield Synthetic ML Pipeline Boot   "
echo "============================================="

echo "Step 1: Generating mapped Synthetic tracking records cleanly..."
python training/generate_synthetic_data.py

echo "---------------------------------------------"
echo "Step 2: Executing XGBoost Premium pricing architecture..."
python training/train_premium.py

echo "---------------------------------------------"
echo "Step 3: Executing Isolation Forest Fraud bindings reliably..."
python training/train_fraud.py

echo "============================================="
echo "   Pipeline Finalized Flawlessly Seamlessly    "
echo "============================================="
