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

# ── Dynamic Registry from JSON ─────────────────────────────
import json
JSON_DATA_DIR = os.path.join(BASE_DIR, "..", "ipl_male_json")
PLAYER_REGISTRY = {} # uuid -> {names: set, primary_name: str}

def build_registry():
    if not os.path.exists(JSON_DATA_DIR):
        print(f"[WARN] JSON data dir not found: {JSON_DATA_DIR}")
        return
    
    print("🔄 Building Player Registry from JSONs...")
    count = 0
    for f in os.listdir(JSON_DATA_DIR):
        if f.endswith(".json"):
            try:
                with open(os.path.join(JSON_DATA_DIR, f), "r") as jf:
                    data = json.load(jf)
                    registry = data.get("info", {}).get("registry", {}).get("people", {})
                    for name, uuid in registry.items():
                        if uuid not in PLAYER_REGISTRY:
                            PLAYER_REGISTRY[uuid] = {"names": {name}, "primary_name": name}
                        else:
                            PLAYER_REGISTRY[uuid]["names"].add(name)
                count += 1
            except: continue
    
    MANUAL = {"fcc21ace": "Anshul Kamboj", "aad0c365": "Nithish Kumar Reddy", "462411b3": "Jasprit Bumrah", "9d430b40": "Sunil Narine"}
    for uuid, full_name in MANUAL.items():
        if uuid in PLAYER_REGISTRY:
            PLAYER_REGISTRY[uuid]["primary_name"] = full_name
            PLAYER_REGISTRY[uuid]["names"].add(full_name)

    print(f"✅ Registry built: {len(PLAYER_REGISTRY)} players from {count} files")

build_registry()

def get_player_by_query(q):
    """Returns (uuid, primary_name) if found in registry"""
    q = q.lower().strip()
    for uuid, info in PLAYER_REGISTRY.items():
        if any(q in n.lower() for n in info["names"]):
            return uuid, info["primary_name"]
    return None, None

class ScoutRequest(BaseModel):
    player: str
    role: Optional[str] = None

@router.post("/scout")
async def scout_player(req: ScoutRequest):
    player, role = req.player, req.role
    
    # 1. Resolve name via registry
    csv_player_name = player
    for uuid, info in PLAYER_REGISTRY.items():
        if player == info["primary_name"] or player in info["names"]:
            # We found the player. Now find which name is in the CSV.
            for name in info["names"]:
                if (not auc_bat.empty and name in auc_bat["batter"].values) or \
                   (not auc_bowl.empty and name in auc_bowl["bowler"].values):
                    csv_player_name = name
                    break
            break

    in_bat = csv_player_name in auc_bat["batter"].values if not auc_bat.empty else False
    in_bowl = csv_player_name in auc_bowl["bowler"].values if not auc_bowl.empty else False
    
    if role is None:
        role = "batter" if in_bat and not in_bowl else "bowler" if in_bowl and not in_bat else "allrounder" if in_bat else None
    
    if not in_bat and not in_bowl:
        raise HTTPException(404, f"Player '{player}' not found")

    result = {"player": player, "role": role, "resolvedName": csv_player_name}
    if role in ("batter","allrounder") and in_bat:
        p = auc_bat[auc_bat["batter"]==csv_player_name].iloc[0]
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
        
        # Enhanced matching using Registry
        match_uuids = set()
        for uuid, info in PLAYER_REGISTRY.items():
            if any(q in n.lower() for n in info["names"]):
                match_uuids.add(uuid)
        
        # Also check direct contains in CSV (fallback/compatibility)
        mask = df["batter"].str.contains(q, case=False, na=False)
        
        # If we have registry matches, prioritize them
        if match_uuids:
            # We need to map short names in CSV to registry entries
            # This is hard without UUIDs in the CSV, but we can use the names set
            for uuid in match_uuids:
                names = PLAYER_REGISTRY[uuid]["names"]
                mask = mask | df["batter"].isin(names)

        df = df[mask]
        if min_score > 0: df = df[df["scouting_score"] >= min_score]
        df = df.sort_values("scouting_score", ascending=False)
        for _, r in df.head(20).iterrows():
            # Use primary name from registry if possible
            display_name = r["batter"]
            # Look up uuid by short name
            for uid, info in PLAYER_REGISTRY.items():
                if display_name in info["names"]:
                    display_name = info["primary_name"]
                    break

            results.append(dict(name=display_name, role="batter", scoutingScore=float(r.scouting_score),
                archetype=r.archetype, headline=f"{int(r.total_runs)} runs | SR {r.overall_sr:.1f}"))

    # 3. Check for Bowlers
    if not auc_bowl.empty and role.lower() in ("","bowler","allrounder"):
        df = auc_bowl.copy()
        mask_b = df["bowler"].str.contains(q, case=False, na=False)
        
        # Apply registry matching to bowlers too
        match_uuids_b = set()
        for uuid, info in PLAYER_REGISTRY.items():
            if any(q in n.lower() for n in info["names"]):
                match_uuids_b.add(uuid)
        
        if match_uuids_b:
            for uuid in match_uuids_b:
                names = PLAYER_REGISTRY[uuid]["names"]
                mask_b = mask_b | df["bowler"].isin(names)

        df = df[mask_b]
        if min_score > 0: df = df[df["scouting_score"] >= min_score]
        df = df.sort_values("scouting_score", ascending=False)
        for _, r in df.head(20).iterrows():
            display_name = r["bowler"]
            for uid, info in PLAYER_REGISTRY.items():
                if display_name in info["names"]:
                    display_name = info["primary_name"]
                    break
            results.append(dict(name=display_name, role="bowler", scoutingScore=float(r.scouting_score),
                archetype=r.archetype, headline=f"{int(r.total_wickets)} wkts | Econ {r.economy:.2f}"))

    # Remove duplicates and sort
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
    batters, bowlers = set(), set()
    if not auc_bat.empty: batters.update(auc_bat["batter"].dropna().unique())
    if not auc_bowl.empty: bowlers.update(auc_bowl["bowler"].dropna().unique())
    
    def to_primary(names_set):
        out = set()
        for n in names_set:
            found = False
            for info in PLAYER_REGISTRY.values():
                if n in info["names"]:
                    out.add(info["primary_name"])
                    found = True
                    break
            if not found: out.add(n)
        return out

    b_names = to_primary(batters)
    bw_names = to_primary(bowlers)
    for info in PLAYER_REGISTRY.values():
        name = info["primary_name"]
        if name not in b_names and name not in bw_names:
            b_names.add(name)

    return {
        "batters": sorted(list(b_names)),
        "bowlers": sorted(list(bw_names)),
        "players": sorted(list(b_names | bw_names))
    }

