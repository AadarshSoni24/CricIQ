"""
CricIQ — Player Scouting Service
"""
import os, pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

try:
    bat_features = pd.read_csv(os.path.join(DATA_DIR, "player_batting_features.csv"))
    bowl_features = pd.read_csv(os.path.join(DATA_DIR, "player_bowling_features.csv"))
    matchup_matrix = pd.read_csv(os.path.join(DATA_DIR, "matchup_matrix.csv"))
    auc_bat = pd.read_csv(os.path.join(DATA_DIR, "auction_batter_profiles.csv"))
    auc_bowl = pd.read_csv(os.path.join(DATA_DIR, "auction_bowler_profiles.csv"))
    print(f"[OK] Scout: {len(auc_bat)} batters, {len(auc_bowl)} bowlers")
except Exception as e:
    print(f"[WARN] Scout data error: {e}")
    bat_features = bowl_features = matchup_matrix = auc_bat = auc_bowl = pd.DataFrame()

class ScoutRequest(BaseModel):
    player: str
    role: Optional[str] = None

@router.post("/scout")
async def scout_player(req: ScoutRequest):
    player, role = req.player, req.role
    in_bat = player in auc_bat["batter"].values if not auc_bat.empty else False
    in_bowl = player in auc_bowl["bowler"].values if not auc_bowl.empty else False
    if role is None:
        role = "batter" if in_bat and not in_bowl else "bowler" if in_bowl and not in_bat else "allrounder" if in_bat else None
    if role is None:
        raise HTTPException(404, f"Player '{player}' not found")

    result = {"player": player, "role": role}
    if role in ("batter","allrounder") and in_bat:
        p = auc_bat[auc_bat["batter"]==player].iloc[0]
        result.update(scoutingScore=float(p.scouting_score), archetype=p.archetype, seasonTrend=p.season_trend,
            profile=dict(totalRuns=int(p.total_runs), totalInnings=int(p.total_innings), overallSR=float(p.overall_sr),
                overallAvg=float(p.overall_avg), boundaryPct=float(p.boundary_pct), dotPct=float(p.dot_pct),
                intentScore=float(p.intent_score), consistency=float(p.consistency), srVsSpin=float(p.sr_vs_spin), srVsPace=float(p.sr_vs_pace)),
            phases=dict(powerplay=dict(sr=float(p.pp_sr),runs=int(p.pp_runs)),
                middle=dict(sr=float(p.mid_sr),runs=int(p.mid_runs)),
                death=dict(sr=float(p.death_sr),runs=int(p.death_runs))))
    if role in ("bowler","allrounder") and in_bowl:
        p = auc_bowl[auc_bowl["bowler"]==player].iloc[0]
        bp = dict(totalWickets=int(p.total_wickets), economy=float(p.economy), bowlingSR=float(p.bowling_sr),
            dotPct=float(p.dot_pct), deathSpecialist=float(p.death_specialist_score), bowlerType=p.bowler_type)
        if role == "bowler":
            result.update(scoutingScore=float(p.scouting_score), archetype=p.archetype, seasonTrend=p.season_trend, profile=bp,
                phases=dict(powerplay=dict(economy=float(p.pp_economy),wickets=int(p.pp_wickets)),
                    middle=dict(economy=float(p.mid_economy),wickets=int(p.mid_wickets)),
                    death=dict(economy=float(p.death_economy),wickets=int(p.death_wickets))))
        else:
            result["profile"]["bowling"] = bp
    return result

@router.get("/scout/search")
async def search_players(q: str = "", role: str = "", min_score: float = 0):
    results = []
    if not auc_bat.empty and role.lower() in ("","batter","allrounder"):
        df = auc_bat.copy()
        if q: df = df[df["batter"].str.contains(q, case=False, na=False)]
        if min_score > 0: df = df[df["scouting_score"] >= min_score]
        for _, r in df.head(15).iterrows():
            results.append(dict(name=r["batter"], role="batter", scoutingScore=float(r.scouting_score),
                archetype=r.archetype, headline=f"{int(r.total_runs)} runs | SR {r.overall_sr:.1f}"))
    if not auc_bowl.empty and role.lower() in ("","bowler","allrounder"):
        df = auc_bowl.copy()
        if q: df = df[df["bowler"].str.contains(q, case=False, na=False)]
        if min_score > 0: df = df[df["scouting_score"] >= min_score]
        for _, r in df.head(15).iterrows():
            results.append(dict(name=r["bowler"], role="bowler", scoutingScore=float(r.scouting_score),
                archetype=r.archetype, headline=f"{int(r.total_wickets)} wkts | Econ {r.economy:.2f}"))
    results.sort(key=lambda x: x["scoutingScore"], reverse=True)
    return {"results": results[:30], "total": len(results)}
