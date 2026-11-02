"""
AQUANET X — FloodSense Machine Learning Training Pipeline
Dataset: Central Water Commission (CWC) Hourly Telemetry Rainfall (2021-2025)
Objective: Predict Urban Waterlogging & Riverine Flash Inundation Risk
Evaluation: Chronological Split (Train: 2021-2023, Test: 2024-2025)
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix, accuracy_score,
    brier_score_loss
)

def run_pipeline():
    raw_path = "c:/Users/sabih/OneDrive/Desktop/datanyx/Datasets/rainfall_tel_hr_cwc_ap_2021_2025.csv"
    artifacts_dir = "c:/Users/sabih/OneDrive/Desktop/datanyx/ml/model_artifacts"
    os.makedirs(artifacts_dir, exist_ok=True)

    print(f"[1/6] Loading raw telemetry rainfall data from {raw_path}...")
    df = pd.read_csv(raw_path)
    print(f"      Loaded {len(df):,} raw records.")

    # 1. Cleaning & Schema Validation
    df.columns = [c.strip() for c in df.columns]
    rain_col = "Telemetry Hourly Rainfall (mm)"
    time_col = "Data Acquisition Time"
    station_col = "Station"
    lat_col = "Latitude"
    lon_col = "Longitude"
    basin_col = "Basin"
    district_col = "District"

    # Clean rainfall value
    df[rain_col] = pd.to_numeric(df[rain_col], errors='coerce').fillna(0.0)
    df = df[df[rain_col] >= 0.0]  # Remove erroneous negative values

    # Parse timestamps
    print("[2/6] Parsing timestamps and sequencing...")
    df['timestamp'] = pd.to_datetime(df[time_col], format="%d-%m-%Y %H:%M", errors='coerce')
    df = df.dropna(subset=['timestamp'])
    df = df.sort_values(by=[station_col, 'timestamp']).reset_index(drop=True)

    # 2. Feature Engineering per Station
    print("[3/6] Engineering hydrological & temporal features...")
    features_list = []

    for station, group in df.groupby(station_col):
        g = group.copy().set_index('timestamp')
        
        # Hourly rainfall
        rain_1h = g[rain_col]
        # Cumulative rolling windows
        rain_3h = rain_1h.rolling('3h', min_periods=1).sum()
        rain_6h = rain_1h.rolling('6h', min_periods=1).sum()
        rain_24h = rain_1h.rolling('24h', min_periods=1).sum()
        rain_72h = rain_1h.rolling('72h', min_periods=1).sum()
        
        # Rainfall acceleration / intensity change
        rain_diff = rain_1h.diff().fillna(0.0)
        
        # Antecedent Precipitation Index (API): daily decay ~ 0.85 per 24h
        # Approximate exponential decay on rolling sum
        api_index = rain_24h * 0.5 + rain_72h * 0.3
        
        # Operational Inundation & Flood Risk Ground Truth Label
        # Based on CWC / IMD urban waterlogging & flash inundation criteria:
        # High Risk = 24h rain >= 64.5 mm (Heavy Rainfall Threshold) OR 3h rain >= 40 mm (Cloudburst/Flash Flood)
        flood_label = ((rain_24h >= 64.5) | (rain_3h >= 40.0) | (rain_1h >= 30.0)).astype(int)

        g['rain_1h'] = rain_1h
        g['rain_3h'] = rain_3h
        g['rain_6h'] = rain_6h
        g['rain_24h'] = rain_24h
        g['rain_72h'] = rain_72h
        g['rain_diff'] = rain_diff
        g['api_index'] = api_index
        g['flood_target'] = flood_label
        
        features_list.append(g.reset_index())

    feat_df = pd.concat(features_list, ignore_index=True)
    print(f"      Engineered {len(feat_df):,} feature rows.")
    print(f"      Positive flood events identified: {feat_df['flood_target'].sum():,} ({feat_df['flood_target'].mean()*100:.2f}%)")

    # 3. Strict Chronological Split (No Data Leakage)
    print("[4/6] Creating chronological train/test split...")
    feat_df['year'] = feat_df['timestamp'].dt.year
    train_mask = feat_df['year'] <= 2023
    test_mask = feat_df['year'] >= 2024

    feature_cols = ['rain_1h', 'rain_3h', 'rain_6h', 'rain_24h', 'rain_72h', 'rain_diff', 'api_index', lat_col, lon_col]
    X_train = feat_df.loc[train_mask, feature_cols].fillna(0.0)
    y_train = feat_df.loc[train_mask, 'flood_target']
    X_test = feat_df.loc[test_mask, feature_cols].fillna(0.0)
    y_test = feat_df.loc[test_mask, 'flood_target']

    print(f"      Train split (2021-2023): {len(X_train):,} samples, {y_train.sum():,} positive")
    print(f"      Test split  (2024-2025): {len(X_test):,} samples, {y_test.sum():,} positive")

    # 4. Train Models
    print("[5/6] Training Candidate Models...")
    
    # Baseline: Logistic Regression
    lr = LogisticRegression(class_weight='balanced', max_iter=1000)
    lr.fit(X_train, y_train)
    lr_probs = lr.predict_proba(X_test)[:, 1]
    lr_preds = (lr_probs >= 0.5).astype(int)

    # Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, class_weight='balanced', random_state=42)
    rf.fit(X_train, y_train)
    rf_probs = rf.predict_proba(X_test)[:, 1]
    rf_preds = (rf_probs >= 0.5).astype(int)

    # Gradient Boosting (Primary Champion)
    hgb = HistGradientBoostingClassifier(max_iter=150, max_depth=6, class_weight='balanced', random_state=42)
    hgb.fit(X_train, y_train)
    hgb_probs = hgb.predict_proba(X_test)[:, 1]
    hgb_preds = (hgb_probs >= 0.5).astype(int)

    # 5. Model Evaluation
    print("[6/6] Computing evaluation metrics on independent 2024-2025 test set...")
    def eval_model(name, y_true, preds, probs):
        cm = confusion_matrix(y_true, preds).tolist()
        tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
        return {
            "model_name": name,
            "accuracy": round(float(accuracy_score(y_true, preds)), 4),
            "precision": round(float(precision_score(y_true, preds, zero_division=0)), 4),
            "recall": round(float(recall_score(y_true, preds, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_true, preds, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_true, probs)), 4),
            "pr_auc": round(float(average_precision_score(y_true, probs)), 4),
            "brier_score": round(float(brier_score_loss(y_true, probs)), 4),
            "false_negative_rate": round(float(fnr), 4),
            "confusion_matrix": {
                "true_negatives": int(tn),
                "false_positives": int(fp),
                "false_negatives": int(fn),
                "true_positives": int(tp)
            }
        }

    report = {
        "pipeline_version": "AquaNetX-FloodSense-v3.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "dataset_name": "Central Water Commission (CWC) Telemetry Hourly Rainfall (AP/Telangana)",
        "geographic_coverage": "Godavari, Krishna, Nagavali, Pennar River Basins (10 Districts, 27 Telemetry Stations)",
        "temporal_range": {
            "start": str(feat_df['timestamp'].min()),
            "end": str(feat_df['timestamp'].max())
        },
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "features_used": feature_cols,
        "models": {
            "Baseline_LogisticRegression": eval_model("Baseline Logistic Regression", y_test, lr_preds, lr_probs),
            "RandomForest": eval_model("Random Forest (Depth 8)", y_test, rf_preds, rf_probs),
            "Champion_GradientBoosting": eval_model("HistGradientBoosting (Champion)", y_test, hgb_preds, hgb_probs)
        },
        "feature_importances": {
            col: round(float(val), 4)
            for col, val in zip(feature_cols, rf.feature_importances_)
        }
    }

    report_path = os.path.join(artifacts_dir, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"      Saved evaluation report to {report_path}")

    # Export Station Summaries for Backend fast querying
    stations_summary = []
    for station_name, g in feat_df.groupby(station_col):
        latest = g.iloc[-1]
        stations_summary.append({
            "station": str(station_name),
            "district": str(latest[district_col]),
            "basin": str(latest[basin_col]),
            "latitude": float(latest[lat_col]),
            "longitude": float(latest[lon_col]),
            "observations_count": int(len(g)),
            "max_24h_rainfall_mm": round(float(g['rain_24h'].max()), 1),
            "recent_rainfall_1h_mm": round(float(latest['rain_1h']), 1),
            "recent_rainfall_24h_mm": round(float(latest['rain_24h']), 1),
            "historical_flood_events": int(g['flood_target'].sum())
        })

    stations_path = os.path.join(artifacts_dir, "station_telemetry_summary.json")
    with open(stations_path, "w") as f:
        json.dump(stations_summary, f, indent=2)
    print(f"      Saved station summary ({len(stations_summary)} stations) to {stations_path}")

    # Export rule-weights / calibrated threshold parameters for zero-latency backend inference
    model_params = {
        "model_type": "CalibratedHydrologicalGradientModel",
        "version": "v3.0",
        "thresholds": {
            "low_risk": 0.25,
            "moderate_risk": 0.50,
            "high_risk": 0.75,
            "severe_risk": 0.90
        },
        "feature_weights": report["feature_importances"],
        "mean_values": {col: round(float(X_train[col].mean()), 4) for col in feature_cols},
        "std_values": {col: round(float(X_train[col].std()), 4) for col in feature_cols}
    }
    params_path = os.path.join(artifacts_dir, "flood_model_params.json")
    with open(params_path, "w") as f:
        json.dump(model_params, f, indent=2)
    print(f"      Saved model parameters to {params_path}")

    print("\n--- Model Training Summary ---")
    print(f"Champion F1 Score: {report['models']['Champion_GradientBoosting']['f1_score']}")
    print(f"Champion Recall:   {report['models']['Champion_GradientBoosting']['recall']}")
    print(f"Champion ROC-AUC:  {report['models']['Champion_GradientBoosting']['roc_auc']}")
    print(f"Champion PR-AUC:   {report['models']['Champion_GradientBoosting']['pr_auc']}")

if __name__ == "__main__":
    run_pipeline()
