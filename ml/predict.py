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
    # Try loading calibrated v2 models first
    if os.path.exists(os.path.join(MODEL_DIR, "xgb_model_v2.pkl")):
        xgb_model = joblib.load(os.path.join(MODEL_DIR, "xgb_model_v2.pkl"))
        lgb_model = joblib.load(os.path.join(MODEL_DIR, "lgb_model_v2.pkl"))
        model_meta = joblib.load(os.path.join(MODEL_DIR, "model_meta_v2.pkl"))
        print("[OK] Loaded Calibrated v2 Models")
    else:
        # Fallback to the 55-feature models
        xgb_model = joblib.load(os.path.join(MODEL_DIR, "xgb_model_55.pkl"))
        lgb_model = joblib.load(os.path.join(MODEL_DIR, "lgb_model_55.pkl"))
        model_meta = joblib.load(os.path.join(MODEL_DIR, "model_meta_55.pkl"))
        print("[OK] Loaded 55-feature models (fallback)")

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

def get_human_label(feat: str, team1: str, team2: str) -> str:
    feat_lower = feat.lower()
    labels = {
        "toss_bat_first": "Toss Winner chose to bat first",
        "toss_winner_is_team1": f"Toss won by {team1}",
        "avg_1st_innings": "Venue average 1st innings score",
        "bat_first_win_pct": "Historical bat-first win rate at venue",
        "pitch_dna_enc": "Pitch DNA (batting vs bowling friendliness)",
        
        "team1_form5": f"{team1} recent form (last 5 matches)",
        "team2_form5": f"{team2} recent form (last 5 matches)",
        "team1_form10": f"{team1} long-term form (last 10 matches)",
        "team2_form10": f"{team2} long-term form (last 10 matches)",
        "team1_h2h_winrate": "Head-to-head win rate",
        
        "t1_team_sr": f"{team1} batting strike rate (overall)",
        "t2_team_sr": f"{team2} batting strike rate (overall)",
        "t1_team_sr_powerplay": f"{team1} batting strike rate (Powerplay)",
        "t2_team_sr_powerplay": f"{team2} batting strike rate (Powerplay)",
        "t1_team_sr_death": f"{team1} batting strike rate (Death overs)",
        "t2_team_sr_death": f"{team2} batting strike rate (Death overs)",
        
        "t1b_team_economy": f"{team1} bowling economy rate (overall)",
        "t2b_team_economy": f"{team2} bowling economy rate (overall)",
        "t1b_team_econ_powerplay": f"{team1} bowling economy rate (Powerplay)",
        "t2b_team_econ_powerplay": f"{team2} bowling economy rate (Powerplay)",
        "t1b_team_econ_death": f"{team1} bowling economy rate (Death overs)",
        "t2b_team_econ_death": f"{team2} bowling economy rate (Death overs)",
        
        "t1_bat_win_pct": f"{team1} win rate when batting first",
        "t2_bat_win_pct": f"{team2} win rate when batting first",
        "t1_chase_win_pct": f"{team1} win rate when chasing",
        "t2_chase_win_pct": f"{team2} win rate when chasing",
        
        "t1_xi_bat_sr": f"{team1} playing XI batting strike rate",
        "t2_xi_bat_sr": f"{team2} playing XI batting strike rate",
        "t1_xi_pp_sr": f"{team1} playing XI Powerplay batting strike rate",
        "t2_xi_pp_sr": f"{team2} playing XI Powerplay batting strike rate",
        "t1_xi_death_sr": f"{team1} playing XI death batting strike rate",
        "t2_xi_death_sr": f"{team2} playing XI death batting strike rate",
        
        "t1_xi_bowl_econ": f"{team1} playing XI bowling economy rate",
        "t2_xi_bowl_econ": f"{team2} playing XI bowling economy rate",
        "t1_xi_pp_econ": f"{team1} playing XI Powerplay bowling economy",
        "t2_xi_pp_econ": f"{team2} playing XI Powerplay bowling economy",
        "t1_xi_death_econ": f"{team1} playing XI death bowling economy",
        "t2_xi_death_econ": f"{team2} playing XI death bowling economy",
        
        "t1_matchup_adv": f"{team1} player matchup advantage",
        "t2_matchup_adv": f"{team2} player matchup advantage",
        
        "t1_venue_sr": f"{team1} scoring speed at venue",
        "t2_venue_sr": f"{team2} scoring speed at venue",
        
        "t1_death_bat_spec": f"{team1} death overs batting depth",
        "t2_death_bat_spec": f"{team2} death overs batting depth",
        "t1_death_bowl_spec": f"{team1} death overs bowling specialty",
        "t2_death_bowl_spec": f"{team2} death overs bowling specialty",
        
        "t1_allrounders": f"All-rounders depth for {team1}",
        "t2_allrounders": f"All-rounders depth for {team2}",
        
        "t1_player_form": f"{team1} average player form",
        "t2_player_form": f"{team2} average player form",
        
        "dew_factor": "Dew factor impact",
        "t1_win_streak": f"{team1} winning streak",
        "t2_win_streak": f"{team2} winning streak",
        "t1_home": f"Home advantage for {team1}",
        "t2_home": f"Home advantage for {team2}",
        
        "diff_xi_bat_sr": "Playing XI batting strike rate difference",
        "diff_xi_bowl_econ": "Playing XI bowling economy difference",
        "diff_player_form": "Average player form difference",
        "diff_win_streak": "Win streak difference",
        "diff_form5": "Last 5 matches form difference",
        "diff_form10": "Last 10 matches form difference",
        "diff_matchup_adv": "Head-to-head matchup superiority",
        "diff_cap_winrate": "Captain win rate difference",
        "diff_xi_pp_sr": "Powerplay batting strike rate difference",
        "diff_xi_death_sr": "Death overs batting strike rate difference",
        "diff_xi_death_econ": "Death overs bowling economy difference",
    }
    if feat_lower in labels:
        return labels[feat_lower]
    
    clean_feat = feat.replace("t1b_", f"{team1} bowling ").replace("t2b_", f"{team2} bowling ")
    clean_feat = clean_feat.replace("t1_", f"{team1} ").replace("t2_", f"{team2} ")
    clean_feat = clean_feat.replace("team1_", f"{team1} ").replace("team2_", f"{team2} ")
    clean_feat = clean_feat.replace("_", " ").strip().title()
    return clean_feat


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
    impactPct: Optional[float] = None
    favorsTeam: Optional[str] = None


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
    insights: Optional[List[str]] = []


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

    # Dynamically populate all team1, team2, and differential features from master_features
    try:
        t1_rows = master_features[(master_features['team1'] == req.team1) | (master_features['team2'] == req.team1)]
        t2_rows = master_features[(master_features['team1'] == req.team2) | (master_features['team2'] == req.team2)]

        last_t1 = t1_rows.iloc[-1] if not t1_rows.empty else None
        is_t1_in_last1 = (last_t1['team1'] == req.team1) if last_t1 is not None else True

        last_t2 = t2_rows.iloc[-1] if not t2_rows.empty else None
        is_t1_in_last2 = (last_t2['team1'] == req.team2) if last_t2 is not None else True

        for f in feature_cols:
            if f in base:
                continue
            if f.startswith("t1_") and last_t1 is not None:
                stem = f[3:]
                col = f"t1_{stem}" if is_t1_in_last1 else f"t2_{stem}"
                if col in last_t1 and pd.notna(last_t1[col]):
                    base[f] = float(last_t1[col])
            elif f.startswith("t1b_") and last_t1 is not None:
                stem = f[4:]
                col = f"t1b_{stem}" if is_t1_in_last1 else f"t2b_{stem}"
                if col in last_t1 and pd.notna(last_t1[col]):
                    base[f] = float(last_t1[col])
            elif f.startswith("t2_") and last_t2 is not None:
                stem = f[3:]
                col = f"t1_{stem}" if is_t1_in_last2 else f"t2_{stem}"
                if col in last_t2 and pd.notna(last_t2[col]):
                    base[f] = float(last_t2[col])
            elif f.startswith("t2b_") and last_t2 is not None:
                stem = f[4:]
                col = f"t1b_{stem}" if is_t1_in_last2 else f"t2b_{stem}"
                if col in last_t2 and pd.notna(last_t2[col]):
                    base[f] = float(last_t2[col])

        # Compute all differential features (diff_...) dynamically
        for f in feature_cols:
            if f.startswith("diff_"):
                stem = f[5:]
                t1v = base.get(f"t1_{stem}") or base.get(f"team1_{stem}") or 0.0
                t2v = base.get(f"t2_{stem}") or base.get(f"team2_{stem}") or 0.0
                base[f] = float(t1v) - float(t2v)
    except Exception as e:
        print(f"Feature lookup error: {e}")

    row_dict = {}
    for f in feature_cols:
        row_dict[f] = float(base.get(f, 0.0))
    features = pd.DataFrame([row_dict])[feature_cols]

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
        from feature_explanations import humanize_shap

        # CalibratedClassifierCV wraps the estimator. TreeExplainer needs the raw tree booster.
        base_xgb = xgb_model
        if hasattr(xgb_model, "calibrated_classifiers_") and len(xgb_model.calibrated_classifiers_) > 0:
            inner_est = xgb_model.calibrated_classifiers_[0].estimator
            if hasattr(inner_est, "estimator"):
                base_xgb = inner_est.estimator
            else:
                base_xgb = inner_est

        explainer = shap.TreeExplainer(base_xgb)
        sv = explainer.shap_values(features)
        shap_vals = sv[0] if isinstance(sv, list) else sv[0]
        
        # Translate SHAP values using feature_explanations module
        raw_expected_val = float(explainer.expected_value) if hasattr(explainer, "expected_value") else 0.0
        if isinstance(raw_expected_val, list):
            raw_expected_val = raw_expected_val[0]

        humanized = humanize_shap(
            shap_values=shap_vals,
            feature_names=feature_cols,
            team1_name=req.team1,
            team2_name=req.team2,
            base_value=raw_expected_val
        )

        # Take top 6-8 reasons, sorted by absolute impact
        for item in humanized[:8]:
            factor_idx = feature_cols.index(item["factor"])
            raw_val = float(shap_vals[factor_idx])
            shap_factors.append(ShapFactor(
                factor=item["factor"],
                impact=round(raw_val, 4),
                plainText=f"{item['reason']} (+{item['impact_pct']:.1f}% win chance)",
                impactPct=item["impact_pct"],
                favorsTeam=item["favors_team"]
            ))
    except Exception as e:
        print(f"[WARN] SHAP humanization error: {e}")
        # Fallback to the original raw SHAP output in case of error
        try:
            explainer = shap.TreeExplainer(base_xgb)
            sv = explainer.shap_values(features)
            shap_vals = sv[0] if isinstance(sv, list) else sv[0]
            pairs = sorted(zip(feature_cols, shap_vals), key=lambda x: abs(x[1]), reverse=True)

            for feat, val in pairs[:8]:
                label = get_human_label(feat, req.team1, req.team2)
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


class LiveSquadRequest(BaseModel):
    team1: str
    team2: str
    match_url: Optional[str] = None


@router.post("/live-squad")
async def get_live_squad(req: LiveSquadRequest):
    """
    Scaffolds live/upcoming match squad fetcher.
    Checks if the toss/playing XI has been announced.
    If announced, returns the confirmed 11-player squads.
    If not announced, returns 'XI not confirmed' status.
    """
    from live_squad_fetch import fetch_confirmed_xi
    return fetch_confirmed_xi(req.team1, req.team2, req.match_url)
