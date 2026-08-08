import os
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import accuracy_score, roc_auc_score, brier_score_loss, classification_report

# ── Paths ──────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.join(BASE_DIR, "..")

csv_path = os.path.join(ROOT_DIR, "master_features_55.csv")
feats_path = os.path.join(ROOT_DIR, "feature_cols_55.pkl")

print(f"Loading data from {csv_path}...")
master = pd.read_csv(csv_path)
all_feats = joblib.load(feats_path)
print(f"Loaded {len(all_feats)} features.")

# ── Data Augmentation (flip team1 ↔ team2) ────────────────
print("\nAugmenting data (perspective flipping)...")

def flip_row(row, cols):
    new = {}
    for col in cols:
        if col == 'label':
            new[col] = 1 - int(row[col])
        elif col == 'match_id':
            new[col] = str(row[col]) + '_flip'
        elif col == 'season_year':
            new[col] = row[col]
        elif col == 'toss_winner_is_team1':
            new[col] = 1 - int(row[col])
        elif col in ('points_diff','nrr_diff') or col.startswith('diff_'):
            new[col] = -float(row[col]) if pd.notna(row[col]) else 0.0
        else:
            # swap t1 ↔ t2
            if col.startswith('t1b_'):
                swap = col.replace('t1b_','t2b_',1)
                new[col] = row[swap] if swap in row.index else row[col]
            elif col.startswith('t2b_'):
                swap = col.replace('t2b_','t1b_',1)
                new[col] = row[swap] if swap in row.index else row[col]
            elif col.startswith('t1_'):
                swap = col.replace('t1_','t2_',1)
                new[col] = row[swap] if swap in row.index else row[col]
            elif col.startswith('t2_'):
                swap = col.replace('t2_','t1_',1)
                new[col] = row[swap] if swap in row.index else row[col]
            elif col.startswith('team1_'):
                swap = col.replace('team1_','team2_',1)
                new[col] = row[swap] if swap in row.index else row[col]
            elif col.startswith('team2_'):
                swap = col.replace('team2_','team1_',1)
                new[col] = row[swap] if swap in row.index else row[col]
            else:
                new[col] = row[col]
    return new

train_cols = all_feats + ['label','season_year','match_id']
train_cols = [c for c in train_cols if c in master.columns]
# Remove duplicates preserving order
seen = set()
train_cols = [c for c in train_cols if not (c in seen or seen.add(c))]

original = master[train_cols].copy()
flipped_rows = [flip_row(row, train_cols) for _, row in original.iterrows()]
flipped = pd.DataFrame(flipped_rows, columns=train_cols)
augmented = pd.concat([original, flipped], ignore_index=True)
print(f"Original matches: {len(original)} | Augmented: {len(augmented)}")

# ── Split Train / Test ────────────────────────────────────
X_aug = augmented[all_feats].fillna(0)
y_aug = augmented['label']
sy_aug = augmented['season_year']

X_train_full = X_aug[sy_aug <= 2024]
y_train_full = y_aug[sy_aug <= 2024]

# Test: only original 2025 matches (no flipped)
test_orig = original[original['season_year'] == 2025]
X_test = test_orig[all_feats].fillna(0)
y_test = test_orig['label']

print(f"Train set: {len(X_train_full)} | Test set (2025): {len(X_test)}")

# Split train_full into fit and calibration subsets (80/20)
X_fit, X_cal, y_fit, y_cal = train_test_split(
    X_train_full, y_train_full, test_size=0.2, random_state=42, stratify=y_train_full
)
print(f"Fit set: {len(X_fit)} | Calibration set: {len(X_cal)}")

scale_pos = float((y_fit == 0).sum()) / float((y_fit == 1).sum())

# ── Train base estimators ────────────────────────────────
print("\nTraining XGBoost with new hyperparameters...")
xgb_model = xgb.XGBClassifier(
    n_estimators=350,
    max_depth=4,
    learning_rate=0.06,  # Increased from 0.015
    subsample=0.75,
    colsample_bytree=0.65,
    min_child_weight=3,  # Decreased from 5
    gamma=0.08,          # Decreased from 0.2
    reg_alpha=0.2,
    reg_lambda=2.0,
    scale_pos_weight=scale_pos,
    random_state=42,
    eval_metric='logloss',
    early_stopping_rounds=35,
    verbosity=0
)
xgb_model.fit(X_fit, y_fit, eval_set=[(X_cal, y_cal)], verbose=False)

print("Training LightGBM with new hyperparameters...")
lgb_model = lgb.LGBMClassifier(
    n_estimators=350,
    max_depth=4,
    learning_rate=0.06,
    subsample=0.75,
    colsample_bytree=0.65,
    min_child_weight=3,
    reg_alpha=0.2,
    reg_lambda=2.0,
    class_weight='balanced',
    random_state=42,
    verbose=-1
)
lgb_model.fit(
    X_fit, y_fit,
    eval_set=[(X_cal, y_cal)],
    callbacks=[lgb.early_stopping(35, verbose=False), lgb.log_evaluation(-1)]
)

# ── Evaluate pre-calibration ─────────────────────────────
xgb_raw_probs = xgb_model.predict_proba(X_test)[:, 1]
lgb_raw_probs = lgb_model.predict_proba(X_test)[:, 1]
ens_raw_probs = (xgb_raw_probs + lgb_raw_probs) / 2.0

print("\n--- Evaluation PRE-CALIBRATION (on 2025 Test Set) ---")
print(f"XGBoost Brier Score: {brier_score_loss(y_test, xgb_raw_probs):.4f}")
print(f"LightGBM Brier Score: {brier_score_loss(y_test, lgb_raw_probs):.4f}")
print(f"Ensemble Brier Score: {brier_score_loss(y_test, ens_raw_probs):.4f}")
print(f"XGBoost Accuracy:    {accuracy_score(y_test, (xgb_raw_probs >= 0.5).astype(int))*100:.2f}%")
print(f"XGBoost ROC AUC:     {roc_auc_score(y_test, xgb_raw_probs):.4f}")

# Print probability spread
def print_spread(probs, name):
    counts = pd.cut(probs, bins=[0, 0.2, 0.4, 0.45, 0.55, 0.6, 0.8, 1.0]).value_counts().sort_index()
    print(f"\n{name} Probability Distribution:")
    for b, c in counts.items():
        print(f"  {str(b):<15}: {c} ({c/len(probs)*100:.1f}%)")

print_spread(ens_raw_probs, "Raw Ensemble")

# ── Calibration ──────────────────────────────────────────
print("\nApplying Isotonic Calibration with FrozenEstimator...")
frozen_xgb = FrozenEstimator(xgb_model)
cal_xgb = CalibratedClassifierCV(frozen_xgb, method='isotonic', cv=None)
cal_xgb.fit(X_cal, y_cal)

frozen_lgb = FrozenEstimator(lgb_model)
cal_lgb = CalibratedClassifierCV(frozen_lgb, method='isotonic', cv=None)
cal_lgb.fit(X_cal, y_cal)

# Predict post-calibration
xgb_cal_probs = cal_xgb.predict_proba(X_test)[:, 1]
lgb_cal_probs = cal_lgb.predict_proba(X_test)[:, 1]
ens_cal_probs = (xgb_cal_probs + lgb_cal_probs) / 2.0

print("\n--- Evaluation POST-CALIBRATION (on 2025 Test Set) ---")
print(f"Calibrated XGBoost Brier Score: {brier_score_loss(y_test, xgb_cal_probs):.4f}")
print(f"Calibrated LightGBM Brier Score: {brier_score_loss(y_test, lgb_cal_probs):.4f}")
print(f"Calibrated Ensemble Brier Score: {brier_score_loss(y_test, ens_cal_probs):.4f}")
print(f"Calibrated Ensemble Accuracy:    {accuracy_score(y_test, (ens_cal_probs >= 0.5).astype(int))*100:.2f}%")
print(f"Calibrated Ensemble ROC AUC:     {roc_auc_score(y_test, ens_cal_probs):.4f}")

print_spread(ens_cal_probs, "Calibrated Ensemble")

# Threshold optimization on calibrated ensemble
best_t, best_acc = 0.5, 0.0
for t in np.arange(0.38, 0.63, 0.01):
    a = accuracy_score(y_test, (ens_cal_probs >= t).astype(int))
    if a > best_acc:
        best_acc, best_t = a, t

print(f"\nBest threshold on calibrated ensemble: {best_t:.2f} (Accuracy: {best_acc*100:.2f}%)")

# ── Feature Importance ───────────────────────────────────
print("\nTop 20 Feature Importances from trained XGBoost:")
imp = pd.Series(xgb_model.feature_importances_, index=all_feats).sort_values(ascending=False)
for i, (f, s) in enumerate(imp.head(20).items()):
    print(f"  {i+1:2d}. {f:<45} {s:.4f}")

# ── Save Models ──────────────────────────────────────────
MODELS_DIR = os.path.join(ROOT_DIR, "ml", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# Save in both workspace root (for streamlit) and ml/models (for fastapi)
for base_p in [ROOT_DIR, MODELS_DIR]:
    joblib.dump(cal_xgb, os.path.join(base_p, "xgb_model_v2.pkl"))
    joblib.dump(cal_lgb, os.path.join(base_p, "lgb_model_v2.pkl"))
    joblib.dump(
        {'use_ensemble': True, 'features': all_feats, 'best_threshold': best_t, 'version': 2},
        os.path.join(base_p, "model_meta_v2.pkl")
    )
print("\nSaved calibrated model files (v2) successfully to root and ml/models directories.")
