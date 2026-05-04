"""
CricIQ — Auction Price Prediction
"""
import os, pandas as pd, numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

try:
    auc_bat = pd.read_csv(os.path.join(DATA_DIR, "auction_batter_profiles.csv"))
    auc_bowl = pd.read_csv(os.path.join(DATA_DIR, "auction_bowler_profiles.csv"))
except:
    auc_bat = auc_bowl = pd.DataFrame()

ARCHETYPE_MULTIPLIER = {
    "Finisher": 1.4, "Aggressor": 1.3, "Anchor": 1.2, "All-Phase": 1.35,
    "Accumulator": 0.8, "Utility": 0.7,
    "Death Specialist": 1.4, "Powerplay Specialist": 1.2, "Strike Bowler": 1.3, "Defensive": 1.0,
}

class AuctionRequest(BaseModel):
    player: str
    role: Optional[str] = None
    basePriceLakh: Optional[float] = 200

@router.post("/auction/price")
async def predict_price(req: AuctionRequest):
    player = req.player
    in_bat = player in auc_bat["batter"].values if not auc_bat.empty else False
    in_bowl = player in auc_bowl["bowler"].values if not auc_bowl.empty else False

    if in_bat:
        p = auc_bat[auc_bat["batter"]==player].iloc[0]
        score = float(p.scouting_score)
        archetype = p.archetype
        role = "batter"
        impact = float(p.overall_sr) * 0.3 + float(p.overall_avg) * 0.5 + score * 0.2
    elif in_bowl:
        p = auc_bowl[auc_bowl["bowler"]==player].iloc[0]
        score = float(p.scouting_score)
        archetype = p.archetype
        role = "bowler"
        impact = (10 - float(p.economy)) * 15 + float(p.total_wickets) * 0.3 + score * 0.2
    else:
        return {"player": player, "error": "Player not found", "bidRange": None}

    mult = ARCHETYPE_MULTIPLIER.get(archetype, 1.0)
    trend = p.get("season_trend", "stable") if hasattr(p, "get") else getattr(p, "season_trend", "stable")
    trend_mult = 1.15 if trend == "improving" else 0.85 if trend == "declining" else 1.0

    base_value = impact * mult * trend_mult
    min_bid = max(req.basePriceLakh, base_value * 0.7)
    max_bid = base_value * 1.4
    recommended = base_value

    tier = "Premium" if score >= 75 else "High Value" if score >= 60 else "Mid Tier" if score >= 45 else "Budget"

    return {
        "player": player, "role": role, "archetype": archetype,
        "scoutingScore": score, "tier": tier,
        "bidRange": {
            "minLakh": round(min_bid, 0), "maxLakh": round(max_bid, 0),
            "recommendedLakh": round(recommended, 0),
        },
        "factors": {
            "archetypeMultiplier": mult, "trendMultiplier": trend_mult,
            "seasonTrend": trend, "impactScore": round(impact, 2),
        }
    }
