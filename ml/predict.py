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
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

router = APIRouter()

# ── Paths ──────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")

# ── Load models & data at startup ─────────────────────────
FALLBACK_FEATURES = [
    "toss_bat_first","toss_winner_is_team1","avg_1st_innings","bat_first_win_pct",
    "pitch_dna_enc","team1_form5","team2_form5","team1_form10","team2_form10",
    "team1_h2h_winrate","t1_team_sr","t2_team_sr","t1_team_sr_powerplay",
    "t2_team_sr_powerplay","t1_team_sr_death","t2_team_sr_death","t1b_team_economy",
    "t2b_team_economy","t1b_team_econ_powerplay","t2b_team_econ_powerplay",
    "t1b_team_econ_death","t2b_team_econ_death","t1_bat_win_pct","t2_bat_win_pct",
    "t1_chase_win_pct","t2_chase_win_pct","t1_xi_bat_sr","t2_xi_bat_sr",
    "t1_xi_pp_sr","t2_xi_pp_sr","t1_xi_death_sr","t2_xi_death_sr",
    "t1_xi_bowl_econ","t2_xi_bowl_econ","t1_xi_pp_econ","t2_xi_pp_econ",
    "t1_xi_death_econ","t2_xi_death_econ","t1_matchup_adv","t2_matchup_adv",
    "t1_venue_sr","t2_venue_sr","t1_death_bat_spec","t2_death_bat_spec",
    "t1_death_bowl_spec","t2_death_bowl_spec","t1_allrounders","t2_allrounders",
    "t1_player_form","t2_player_form","dew_factor","t1_win_streak","t2_win_streak",
    "t1_home","t2_home","season_year",
    "diff_xi_bat_sr","diff_xi_bowl_econ","diff_player_form","diff_win_streak",
    "diff_form5","diff_form10","diff_matchup_adv","diff_cap_winrate",
    "diff_xi_pp_sr","diff_xi_death_sr","diff_xi_death_econ"
]

try:
    xgb_model = joblib.load(os.path.join(MODEL_DIR, "xgb_model_55.pkl"))
    lgb_model = joblib.load(os.path.join(MODEL_DIR, "lgb_model_55.pkl"))
    model_meta = joblib.load(os.path.join(MODEL_DIR, "model_meta_55.pkl"))
    feature_cols = (
        model_meta.get("features") or
        model_meta.get("feature_cols") or
        model_meta.get("feature_names") or
        model_meta.get("columns") or
        FALLBACK_FEATURES
    )
    print(f"[DEBUG] model_meta keys: {list(model_meta.keys())}")
    print(f"[DEBUG] feature_cols count: {len(feature_cols)}")
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


def get_match_insights(team1, team2, venue_name):
    """Generate human-readable insights for why a team might win."""
    insights = []
    try:
        matches = pd.read_csv(os.path.join(DATA_DIR, "matches.csv"))
        # 1. Team performance at this venue
        v_matches = matches[matches['venue'].str.contains(venue_name.split(',')[0], case=False, na=False)]
        if not v_matches.empty:
            t1_wins = len(v_matches[v_matches['winner'] == team1])
            t2_wins = len(v_matches[v_matches['winner'] == team2])
            if t1_wins > t2_wins:
                insights.append(f"🏟️ {team1} Fortress: They have won {t1_wins} matches at this venue compared to {t2_wins} for {team2}.")
            elif t2_wins > t1_wins:
                insights.append(f"🏟️ {team2} Fortress: They have won {t2_wins} here compared to {t1_wins} for {team1}.")

        # 2. Player Performance on this ground (using auction profiles or master features)
        insights.append(f"📈 Ground Stats: Avg 1st innings here is {get_venue_info(venue_name)['avg_1st_innings']} runs.")
        
        # 3. Recent Momentum (Last 7)
        all_team_matches = matches[(matches['team1'].isin([team1, team2])) | (matches['team2'].isin([team1, team2]))].sort_values('date', ascending=False)
        t1_recent = all_team_matches[(all_team_matches['team1']==team1) | (all_team_matches['team2']==team1)].head(7)
        t2_recent = all_team_matches[(all_team_matches['team1']==team2) | (all_team_matches['team2']==team2)].head(7)
        
        t1_form = len(t1_recent[t1_recent['winner']==team1])
        t2_form = len(t2_recent[t2_recent['winner']==team2])
        
        if t1_form > t2_form:
            insights.append(f"🔥 Momentum: {team1} is in better form with {t1_form}/7 recent wins.")
        elif t2_form > t1_form:
            insights.append(f"🔥 Momentum: {team2} is peaking with {t2_form}/7 recent wins.")

    except Exception as e:
        print(f"Insight error: {e}")
    return insights


@router.post("/predict", response_model=PredictResponse)
async def predict_match(req: PredictRequest):
    """Run match winner prediction using XGB+LGB ensemble."""
    if xgb_model is None:
        raise HTTPException(status_code=503, detail="ML models not loaded")

    vinfo = get_venue_info(req.venue)
    insights = get_match_insights(req.team1, req.team2, req.venue)
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

    # After building base dict, fill missing features with defaults
    try:
        t1_rows = master_features[(master_features['team1'] == req.team1) | (master_features['team2'] == req.team1)]
        if not t1_rows.empty:
            last = t1_rows.iloc[-1]
            is_t1 = (last['team1'] == req.team1)
            p = "t1_" if is_t1 else "t2_"
            base["t1_team_sr"] = float(last[f"{p}team_sr"])
            base["t1_xi_bat_sr"] = float(last[f"{p}xi_bat_sr"])
            base["t1_xi_bowl_econ"] = float(last[f"{p}xi_bowl_econ"])
            base["t1_win_streak"] = float(last[f"{p}win_streak"])
            base["team1_h2h_winrate"] = req.h2h_winrate if req.h2h_winrate else float(last["team1_h2h_winrate" if is_t1 else "team2_h2h_winrate"])
            
        t2_rows = master_features[(master_features['team1'] == req.team2) | (master_features['team2'] == req.team2)]
        if not t2_rows.empty:
            last = t2_rows.iloc[-1]
            is_t1 = (last['team1'] == req.team2)
            p = "t1_" if is_t1 else "t2_"
            base["t2_team_sr"] = float(last[f"{p}team_sr"])
            base["t2_xi_bat_sr"] = float(last[f"{p}xi_bat_sr"])
            base["t2_xi_bowl_econ"] = float(last[f"{p}xi_bowl_econ"])
            base["t2_win_streak"] = float(last[f"{p}win_streak"])
            
        base["diff_xi_bat_sr"] = base.get("t1_xi_bat_sr", 130) - base.get("t2_xi_bat_sr", 130)
        base["diff_xi_bowl_econ"] = base.get("t1_xi_bowl_econ", 8) - base.get("t2_xi_bowl_econ", 8)
        base["diff_win_streak"] = base.get("t1_win_streak", 0) - base.get("t2_win_streak", 0)
    except Exception as e:
        print(f"Feature lookup error: {e}")

    row_dict = {}
    for f in feature_cols:
        if f in base:
            row_dict[f] = base[f]
        else:
            row_dict[f] = 0  # default for unknown features
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
        insights=insights,
    )
