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
    q = q.strip().lower()
    if not q: return {"results": [], "total": 0}

    # 1. Check for Teams
    TEAMS = [
        {"name": "Chennai Super Kings", "short": "CSK"},
        {"name": "Mumbai Indians", "short": "MI"},
        {"name": "Royal Challengers Bengaluru", "short": "RCB"},
        {"name": "Kolkata Knight Riders", "short": "KKR"},
        {"name": "Sunrisers Hyderabad", "short": "SRH"},
        {"name": "Delhi Capitals", "short": "DC"},
        {"name": "Rajasthan Royals", "short": "RR"},
        {"name": "Punjab Kings", "short": "PBKS"},
        {"name": "Gujarat Titans", "short": "GT"},
        {"name": "Lucknow Super Giants", "short": "LSG"}
    ]
    for t in TEAMS:
        if q in t["name"].lower() or q in t["short"].lower():
            results.append({
                "name": t["name"],
                "role": "Team",
                "scoutingScore": 100,
                "archetype": "Franchise",
                "headline": f"IPL Team ({t['short']})"
            })

    # 2. Check for Batters
    if not auc_bat.empty and role.lower() in ("","batter","allrounder"):
        df = auc_bat.copy()
        # Custom matching: check if any part of the query matches any part of the name
        # OR if it's a known alias
        ALIASES = {
            "virat": "V Kohli", "kohli": "V Kohli",
            "dhoni": "MS Dhoni", "mahendra": "MS Dhoni",
            "rohit": "RG Sharma", "sharma": "RG Sharma",
            "bumrah": "JJ Bumrah", "jasprit": "JJ Bumrah",
            "abd": "AB de Villiers", "villiers": "AB de Villiers",
            "sky": "SA Yadav", "surya": "SA Yadav",
            "hardik": "HH Pandya", "pandya": "HH Pandya"
        }
        
        mask = df["batter"].str.contains(q, case=False, na=False)
        # Also check aliases
        for alias, real_name in ALIASES.items():
            if q in alias:
                mask = mask | (df["batter"] == real_name)
        
        # Word-based match: "Virat Kohli" matches "V Kohli"
        q_words = q.split()
        if len(q_words) > 0:
            for word in q_words:
                if len(word) > 2:
                    mask = mask | df["batter"].str.contains(word, case=False, na=False)

        df = df[mask]
        if min_score > 0: df = df[df["scouting_score"] >= min_score]
        # Sort by scouting score to get "famous"/best players first
        df = df.sort_values("scouting_score", ascending=False)
        for _, r in df.head(20).iterrows():
            results.append(dict(name=r["batter"], role="batter", scoutingScore=float(r.scouting_score),
                archetype=r.archetype, headline=f"{int(r.total_runs)} runs | SR {r.overall_sr:.1f}"))

    # 3. Check for Bowlers
    if not auc_bowl.empty and role.lower() in ("","bowler","allrounder"):
        df = auc_bowl.copy()
        ALIASES_B = {
            "bumrah": "JJ Bumrah", "jasprit": "JJ Bumrah",
            "shami": "Mohammed Shami", "rashid": "Rashid Khan",
            "chahal": "YS Chahal", "yuzvendra": "YS Chahal",
            "kuldeep": "Kuldeep Yadav", "siraj": "Mohammed Siraj",
            "bhuvi": "B Kumar", "bhuvneshwar": "B Kumar"
        }
        
        mask_b = df["bowler"].str.contains(q, case=False, na=False)
        for alias, real_name in ALIASES_B.items():
            if q in alias:
                mask_b = mask_b | (df["bowler"] == real_name)
        
        q_words = q.split()
        if len(q_words) > 0:
            for word in q_words:
                if len(word) > 2:
                    mask_b = mask_b | df["bowler"].str.contains(word, case=False, na=False)

        df = df[mask_b]
        if min_score > 0: df = df[df["scouting_score"] >= min_score]
        df = df.sort_values("scouting_score", ascending=False)
        for _, r in df.head(20).iterrows():
            results.append(dict(name=r["bowler"], role="bowler", scoutingScore=float(r.scouting_score),
                archetype=r.archetype, headline=f"{int(r.total_wickets)} wkts | Econ {r.economy:.2f}"))

    # Remove duplicates (if any player is in both) and sort final list
    seen = set()
    final_results = []
    for res in results:
        key = (res["name"], res["role"])
        if key not in seen:
            seen.add(key)
            final_results.append(res)
    
    final_results.sort(key=lambda x: (x["role"] != "Team", -x["scoutingScore"]))
    return {"results": final_results[:30], "total": len(final_results)}

@router.get("/scout/players")
async def get_all_players():
    batters = auc_bat["batter"].unique().tolist() if not auc_bat.empty else []
    bowlers = auc_bowl["bowler"].unique().tolist() if not auc_bowl.empty else []
    return {"batters": sorted(batters), "bowlers": sorted(bowlers)}
