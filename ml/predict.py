"""
CricIQ — Match Prediction Logic
================================
Uses XGBoost + LightGBM ensemble (55 features) for match winner prediction.
Returns win probability + SHAP-based factor explanations.
"""

import os
import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

# ── Paths ──────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

# ── Load models & data at startup ─────────────────────────
try:
    xgb_model = joblib.load(os.path.join(MODEL_DIR, "xgb_model_55.pkl"))
    lgb_model = joblib.load(os.path.join(MODEL_DIR, "lgb_model_55.pkl"))
    model_meta = joblib.load(os.path.join(MODEL_DIR, "model_meta_55.pkl"))
    feature_cols = model_meta.get("feature_cols", [])
    threshold = model_meta.get("best_threshold", 0.5)
    use_ensemble = model_meta.get("use_ensemble", True)
    print(f"[OK] Loaded ensemble model with {len(feature_cols)} features")
except Exception as e:
    print(f"[WARN] Model loading error: {e}")
    xgb_model = None
    lgb_model = None
    feature_cols = []
    threshold = 0.5
    use_ensemble = False

try:
    venue_features = pd.read_csv(os.path.join(DATA_DIR, "venue_features.csv"))
    master_features = pd.read_csv(os.path.join(DATA_DIR, "master_features_55.csv"))
    print(f"[OK] Loaded venue data ({len(venue_features)} venues)")
except Exception as e:
    print(f"[WARN] Data loading error: {e}")
    venue_features = pd.DataFrame()
    master_features = pd.DataFrame()

# ── SHAP human-readable labels ────────────────────────────
SHAP_LABELS = {
    "toss_bat_first": "Toss: chose to bat first",
    "toss_winner_is_team1": "Toss won by team 1",
    "avg_1st_innings": "Venue avg 1st innings score",
    "bat_first_win_pct": "Bat first win % at venue",
    "pitch_dna_enc": "Pitch type (batting/bowling)",
    "team1_form5": "Team 1 — last 5 match form",
    "team2_form5": "Team 2 — last 5 match form",
    "team1_form10": "Team 1 — last 10 match form",
    "team2_form10": "Team 2 — last 10 match form",
    "team1_h2h_winrate": "Head-to-head win rate",
    "season_year": "Season year",
    "t1_xi_bat_sr": "Team 1 XI batting SR",
    "t2_xi_bat_sr": "Team 2 XI batting SR",
    "t1_xi_death_econ": "Team 1 death bowling economy",
    "t2_xi_death_econ": "Team 2 death bowling economy",
    "t1_matchup_adv": "Team 1 bowling matchup advantage",
    "t2_matchup_adv": "Team 2 bowling matchup advantage",
    "dew_factor": "Dew factor at venue",
    "t1_home": "Team 1 home advantage",
    "t2_home": "Team 2 home advantage",
    "points_diff": "Points table gap",
    "diff_xi_bat_sr": "Batting SR differential",
    "diff_xi_bowl_econ": "Bowling economy differential",
}


# ── Request / Response Models ─────────────────────────────
class PredictRequest(BaseModel):
    team1: str
    team2: str
    venue: str
    toss_winner: str
    toss_decision: str  # "bat" or "field"
    team1_form5: Optional[float] = 0.5
    team2_form5: Optional[float] = 0.5
    team1_form10: Optional[float] = 0.5
    team2_form10: Optional[float] = 0.5
    h2h_winrate: Optional[float] = 0.5
    season_year: Optional[int] = 2026


class ShapFactor(BaseModel):
    factor: str
    impact: float
    plainText: str


class PredictResponse(BaseModel):
    team1: str
    team2: str
    venue: str
    predictedWinner: str
    team1WinProb: float
    team2WinProb: float
    confidence: float
    shapFactors: List[ShapFactor]
    venueInfo: dict


def get_venue_info(venue_name: str) -> dict:
    """Look up venue stats from CSV."""
    if venue_features.empty:
        return {"avg_1st_innings": 165.0, "bat_first_win_pct": 0.5, "pitch_dna": "balanced"}
    
    part = venue_name.split(",")[0]
    row = venue_features[venue_features["venue"].str.contains(part, case=False, na=False)]
    if row.empty:
        return {"avg_1st_innings": 165.0, "bat_first_win_pct": 0.5, "pitch_dna": "balanced"}
    
    r = row.iloc[0]
    return {
        "avg_1st_innings": float(r.get("avg_1st_innings", 165)),
        "bat_first_win_pct": float(r.get("bat_first_win_pct", 0.5)),
        "pitch_dna": str(r.get("pitch_dna", "balanced")),
        "matches_played": int(r.get("matches_played", 0)),
    }


@router.post("/predict", response_model=PredictResponse)
async def predict_match(req: PredictRequest):
    """Run match winner prediction using XGB+LGB ensemble."""
    if xgb_model is None:
        raise HTTPException(status_code=503, detail="ML models not loaded")

    vinfo = get_venue_info(req.venue)
    pitch_map = {"batting_friendly": 2, "balanced": 1, "bowling_friendly": 0}

    # Build feature vector
    base = {
        "toss_bat_first": 1 if req.toss_decision == "bat" else 0,
        "toss_winner_is_team1": 1 if req.toss_winner == req.team1 else 0,
        "avg_1st_innings": vinfo["avg_1st_innings"],
        "bat_first_win_pct": vinfo["bat_first_win_pct"],
        "pitch_dna_enc": pitch_map.get(vinfo["pitch_dna"], 1),
        "team1_form5": req.team1_form5,
        "team2_form5": req.team2_form5,
        "team1_form10": req.team1_form10,
        "team2_form10": req.team2_form10,
        "team1_h2h_winrate": req.h2h_winrate,
        "season_year": req.season_year,
    }

    row_dict = {f: base.get(f, 0) for f in feature_cols}
    features = pd.DataFrame([row_dict])

    # Ensemble prediction
    if use_ensemble and lgb_model is not None:
        prob = (
            xgb_model.predict_proba(features)[0] * 0.5
            + lgb_model.predict_proba(features)[0] * 0.5
        )
    else:
        prob = xgb_model.predict_proba(features)[0]

    team1_prob = float(prob[1]) * 100
    team2_prob = float(prob[0]) * 100
    winner = req.team1 if team1_prob > team2_prob else req.team2
    confidence = max(team1_prob, team2_prob)

    # SHAP explanations
    shap_factors = []
    try:
        import shap
        explainer = shap.TreeExplainer(xgb_model)
        sv = explainer.shap_values(features)
        shap_vals = sv[0] if isinstance(sv, list) else sv[0]
        pairs = sorted(zip(feature_cols, shap_vals), key=lambda x: abs(x[1]), reverse=True)

        for feat, val in pairs[:10]:
            label = SHAP_LABELS.get(feat, feat.replace("_", " ").title())
            direction = f"favours {req.team1}" if val > 0 else f"favours {req.team2}"
            shap_factors.append(ShapFactor(
                factor=feat,
                impact=round(float(val), 4),
                plainText=f"{label}: {direction} (impact: {abs(val):.3f})",
            ))
    except Exception:
        pass

    return PredictResponse(
        team1=req.team1,
        team2=req.team2,
        venue=req.venue,
        predictedWinner=winner,
        team1WinProb=round(team1_prob, 2),
        team2WinProb=round(team2_prob, 2),
        confidence=round(confidence, 2),
        shapFactors=shap_factors,
        venueInfo=vinfo,
    )
