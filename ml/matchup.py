"""
CricIQ — Matchup Explorer Service
=================================
Provides detailed head-to-head analysis between batters and bowlers.
"""
import os, pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Load data once
try:
    deliveries = pd.read_csv(os.path.join(DATA_DIR, "deliveries.csv"))
    matchup_matrix = pd.read_csv(os.path.join(DATA_DIR, "matchup_matrix.csv"))
    print(f"[OK] Matchup: Loaded {len(deliveries)} deliveries")
except Exception as e:
    print(f"[WARN] Matchup data error: {e}")
    deliveries = pd.DataFrame()
    matchup_matrix = pd.DataFrame()

class MatchupRequest(BaseModel):
    batter: str
    bowler: str

from scout import PLAYER_REGISTRY

def get_csv_names(primary_name):
    for uid, info in PLAYER_REGISTRY.items():
        if info["primary_name"] == primary_name or primary_name in info["names"]:
            return info["names"]
    return {primary_name}

@router.post("/matchup")
async def get_matchup(req: MatchupRequest):
    batter, bowler = req.batter, req.bowler
    
    bat_names = get_csv_names(batter)
    bowl_names = get_csv_names(bowler)

    # Get aggregated summary from matrix
    summary = {}
    if not matchup_matrix.empty:
        row = matchup_matrix[matchup_matrix["batter"].isin(bat_names) & matchup_matrix["bowler"].isin(bowl_names)]
        if not row.empty:
            summary = row.iloc[0].to_dict()
            summary["batter"] = batter
            summary["bowler"] = bowler
    
    # Get ball-by-ball history from deliveries
    if deliveries.empty:
        raise HTTPException(500, "Deliveries data not loaded")
    
    h2h = deliveries[deliveries["batter"].isin(bat_names) & deliveries["bowler"].isin(bowl_names)].copy()
    
    if h2h.empty:
        # Even if not in matrix (which might have a threshold), we check deliveries
        if not summary:
            return {"error": "No historical data found for this matchup", "batter": batter, "bowler": bowler}

    # Sort by match_id and ball sequence
    h2h = h2h.sort_values(["match_id", "inning", "over", "ball"])
    
    # Prepare ball-by-ball list
    history = []
    for _, r in h2h.iterrows():
        history.append({
            "matchId": int(r["match_id"]),
            "season": str(r["season"]),
            "over": int(r["over"]),
            "ball": int(r["ball"]),
            "runs": int(r["runs_batter"]),
            "isWicket": bool(r["is_wicket"]),
            "wicketKind": str(r["wicket_kind"]) if pd.notna(r["wicket_kind"]) else None,
            "isBoundary": bool(r["is_boundary_4"] or r["is_boundary_6"]),
            "isDot": bool(r["is_dot"])
        })

    # If summary is empty (e.g. less than threshold in matrix), calculate it on the fly
    if not summary and not h2h.empty:
        balls = len(h2h)
        runs = int(h2h["runs_batter"].sum())
        dismissals = int(h2h["is_wicket"].sum())
        dots = int(h2h["is_dot"].sum())
        fours = int(h2h["is_boundary_4"].sum())
        sixes = int(h2h["is_boundary_6"].sum())
        
        summary = {
            "batter": batter,
            "bowler": bowler,
            "balls": balls,
            "runs": runs,
            "dismissals": dismissals,
            "dots": dots,
            "fours": fours,
            "sixes": sixes,
            "strike_rate": round((runs / balls) * 100, 2) if balls > 0 else 0,
            "economy": round((runs / balls) * 6, 2) if balls > 0 else 0,
            "dismissal_pct": round((dismissals / balls) * 100, 2) if balls > 0 else 0,
            "dot_pct": round((dots / balls) * 100, 2) if balls > 0 else 0,
            "boundary_pct": round(((fours + sixes) / balls) * 100, 2) if balls > 0 else 0
        }

    # Advantage verdict logic
    verdict = "EVEN CONTEST"
    verdict_code = "neutral"
    
    if not h2h.empty:
        sr = summary.get("strike_rate", 0)
        dp = summary.get("dismissal_pct", 0)
        
        if dp > 10 or (sr < 110 and summary.get("dot_pct", 0) > 45):
            verdict = f"BOWLER DOMINATES — {bowler} has the edge"
            verdict_code = "bowler"
        elif sr > 165 or summary.get("boundary_pct", 0) > 30:
            verdict = f"BATTER DOMINATES — {batter} has the edge"
            verdict_code = "batter"

    return {
        "summary": summary,
        "history": history,
        "verdict": verdict,
        "verdictCode": verdict_code
    }
