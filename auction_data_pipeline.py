"""
CricIQ — Auction Intelligence Data Pipeline
=============================================
Processes raw ball-by-ball IPL data (deliveries.csv, 279,586 rows)
into franchise-grade scouting profiles for every player.

Outputs:
  - auction_batter_profiles.csv   (40+ columns per batter)
  - auction_bowler_profiles.csv   (35+ columns per bowler)
  - auction_season_trends.csv     (per-player-per-season stats)

Run:  python auction_data_pipeline.py
"""

import pandas as pd
import numpy as np
from scipy import stats as scipy_stats
import warnings
warnings.filterwarnings('ignore')

print("🏏 CricIQ Auction Intelligence Pipeline")
print("=" * 50)

# ── Load data ──────────────────────────────────────────────
print("Loading data...")
deliveries = pd.read_csv('deliveries.csv', low_memory=False)
matches = pd.read_csv('matches.csv')
matchup_matrix = pd.read_csv('matchup_matrix.csv')
player_venue = pd.read_csv('player_venue_stats.csv')

print(f"   Deliveries: {len(deliveries):,} rows")
print(f"   Matches:    {len(matches):,} rows")
print(f"   Matchups:   {len(matchup_matrix):,} pairs")

# ── Normalize season to integer year ───────────────────────
SEASON_MAP = {
    '2007/08': 2008, '2009': 2009, '2009/10': 2010, '2011': 2011,
    '2012': 2012, '2013': 2013, '2014': 2014, '2015': 2015,
    '2016': 2016, '2017': 2017, '2018': 2018, '2019': 2019,
    '2020/21': 2020, '2021': 2021, '2022': 2022, '2023': 2023,
    '2024': 2024, '2025': 2025, '2026': 2026,
}
deliveries['season_year'] = deliveries['season'].astype(str).map(SEASON_MAP).fillna(2020).astype(int)
matches['season_year'] = matches['season'].astype(str).map(SEASON_MAP).fillna(2020).astype(int)

# Merge match info into deliveries for chase/defend context
deliveries = deliveries.merge(
    matches[['match_id', 'winner', 'toss_decision', 'venue', 'date']],
    on='match_id', how='left', suffixes=('', '_match')
)

# ══════════════════════════════════════════════════════════════
# STEP 1: BOWLER TYPE INFERENCE (Spin vs Pace)
# ══════════════════════════════════════════════════════════════
print("\n🎳 Inferring bowler types (spin vs pace)...")

# Heuristic: bowlers who bowl >55% of their balls in middle overs
# are likely spinners. Pace bowlers bowl more in PP + death.
bowler_phase_dist = deliveries.groupby(['bowler', 'phase']).size().unstack(fill_value=0)
bowler_phase_dist.columns = [f'balls_{c}' for c in bowler_phase_dist.columns]
bowler_phase_dist['total_balls'] = bowler_phase_dist.sum(axis=1)

# Only classify bowlers with 60+ balls
bowler_phase_dist = bowler_phase_dist[bowler_phase_dist['total_balls'] >= 60].copy()

mid_col = 'balls_middle' if 'balls_middle' in bowler_phase_dist.columns else None
pp_col = 'balls_powerplay' if 'balls_powerplay' in bowler_phase_dist.columns else None
death_col = 'balls_death' if 'balls_death' in bowler_phase_dist.columns else None

if mid_col:
    bowler_phase_dist['middle_pct'] = bowler_phase_dist[mid_col] / bowler_phase_dist['total_balls']
else:
    bowler_phase_dist['middle_pct'] = 0.33

# Spinners: high middle overs %. Pacers: high PP + death %
bowler_phase_dist['bowler_type'] = np.where(
    bowler_phase_dist['middle_pct'] > 0.50, 'spin', 'pace'
)

BOWLER_TYPES = bowler_phase_dist['bowler_type'].to_dict()
deliveries['bowler_type'] = deliveries['bowler'].map(BOWLER_TYPES).fillna('pace')

print(f"   Classified {len(BOWLER_TYPES)} bowlers: "
      f"{sum(v=='spin' for v in BOWLER_TYPES.values())} spin, "
      f"{sum(v=='pace' for v in BOWLER_TYPES.values())} pace")

# ══════════════════════════════════════════════════════════════
# STEP 2: PER-INNINGS BATTER AGGREGATION
# ══════════════════════════════════════════════════════════════
print("\n🏏 Computing per-innings batter stats...")

# Per match-innings batter stats
batter_innings = deliveries.groupby(['match_id', 'batter', 'inning', 'season_year']).agg(
    runs=('runs_batter', 'sum'),
    balls=('runs_batter', 'count'),
    fours=('is_boundary_4', 'sum'),
    sixes=('is_boundary_6', 'sum'),
    dots=('is_dot', 'sum'),
    is_wicket=('is_wicket', 'sum'),
    batting_team=('batting_team', 'first'),
).reset_index()

batter_innings['sr'] = np.where(batter_innings['balls'] > 0,
                                 batter_innings['runs'] / batter_innings['balls'] * 100, 0)
batter_innings['dismissed'] = (batter_innings['is_wicket'] > 0).astype(int)

# Add match context: chase or defend
batter_innings = batter_innings.merge(
    matches[['match_id', 'winner', 'toss_decision']],
    on='match_id', how='left'
)
batter_innings['is_chase'] = (batter_innings['inning'] == 2).astype(int)
batter_innings['won'] = (batter_innings['batting_team'] == batter_innings['winner']).astype(int)

# ══════════════════════════════════════════════════════════════
# STEP 3: BATTER ADVANCED METRICS
# ══════════════════════════════════════════════════════════════
print("📊 Computing batter advanced metrics...")

batter_profiles = []

for batter_name, group in batter_innings.groupby('batter'):
    if len(group) < 5:  # Minimum 5 innings
        continue

    total_runs = group['runs'].sum()
    total_balls = group['balls'].sum()
    total_innings = len(group)
    total_dismissed = group['dismissed'].sum()
    total_fours = group['fours'].sum()
    total_sixes = group['sixes'].sum()
    total_dots = group['dots'].sum()

    overall_sr = total_runs / max(total_balls, 1) * 100
    overall_avg = total_runs / max(total_dismissed, 1)
    boundary_pct = (total_fours + total_sixes) / max(total_balls, 1) * 100
    dot_pct = total_dots / max(total_balls, 1) * 100

    # ── Last 10 innings ──
    last10 = group.sort_values(['season_year', 'match_id']).tail(10)
    last10_runs = last10['runs'].tolist()
    last10_avg = last10['runs'].mean()
    last10_sr = last10['runs'].sum() / max(last10['balls'].sum(), 1) * 100

    # ── Phase-wise SR (from deliveries, re-query) ──
    batter_deliveries = deliveries[deliveries['batter'] == batter_name]

    pp_balls = batter_deliveries[batter_deliveries['phase'] == 'powerplay']
    mid_balls = batter_deliveries[batter_deliveries['phase'] == 'middle']
    death_balls = batter_deliveries[batter_deliveries['phase'] == 'death']

    pp_sr = pp_balls['runs_batter'].sum() / max(len(pp_balls), 1) * 100
    mid_sr = mid_balls['runs_batter'].sum() / max(len(mid_balls), 1) * 100
    death_sr = death_balls['runs_batter'].sum() / max(len(death_balls), 1) * 100

    pp_runs = int(pp_balls['runs_batter'].sum())
    mid_runs = int(mid_balls['runs_batter'].sum())
    death_runs = int(death_balls['runs_batter'].sum())

    # ── Spin vs Pace performance ──
    vs_spin = batter_deliveries[batter_deliveries['bowler_type'] == 'spin']
    vs_pace = batter_deliveries[batter_deliveries['bowler_type'] == 'pace']

    sr_vs_spin = vs_spin['runs_batter'].sum() / max(len(vs_spin), 1) * 100
    sr_vs_pace = vs_pace['runs_batter'].sum() / max(len(vs_pace), 1) * 100
    avg_vs_spin = vs_spin['runs_batter'].sum() / max(vs_spin['is_wicket'].sum(), 1)
    avg_vs_pace = vs_pace['runs_batter'].sum() / max(vs_pace['is_wicket'].sum(), 1)

    # ── Intent Score: SR in first 10 balls of each innings ──
    intent_scores = []
    for (mid, inn), inn_group in batter_deliveries.groupby(['match_id', 'inning']):
        first_10 = inn_group.head(10)
        if len(first_10) >= 5:
            intent_scores.append(first_10['runs_batter'].sum() / len(first_10) * 100)
    intent_score = np.mean(intent_scores) if intent_scores else overall_sr

    # ── Acceleration Index: death_sr / pp_sr ──
    acceleration = death_sr / max(pp_sr, 50) if pp_sr > 0 else 1.0

    # ── Pressure Index: SR when chasing with RR > 10 ──
    chase_deliveries = batter_deliveries[batter_deliveries['inning'] == 2].copy()
    if len(chase_deliveries) > 20:
        # Compute cumulative runs needed context per match
        pressure_balls = chase_deliveries[chase_deliveries['over'] >= 15]  # Late-chase pressure
        pressure_sr = pressure_balls['runs_batter'].sum() / max(len(pressure_balls), 1) * 100
    else:
        pressure_sr = overall_sr

    # ── Consistency Score ──
    innings_scores = group['runs'].values
    if len(innings_scores) >= 5:
        score_std = np.std(innings_scores)
        score_mean = np.mean(innings_scores)
        consistency = max(0, 1 - (score_std / max(score_mean, 1)))
        consistency = round(min(consistency, 1.0), 3)
    else:
        consistency = 0.5

    # ── Chase vs Defend ──
    chase_innings = group[group['is_chase'] == 1]
    defend_innings = group[group['is_chase'] == 0]

    chase_sr = chase_innings['runs'].sum() / max(chase_innings['balls'].sum(), 1) * 100
    chase_avg = chase_innings['runs'].sum() / max(chase_innings['dismissed'].sum(), 1)
    defend_sr = defend_innings['runs'].sum() / max(defend_innings['balls'].sum(), 1) * 100
    defend_avg = defend_innings['runs'].sum() / max(defend_innings['dismissed'].sum(), 1)
    chase_win_pct = chase_innings['won'].mean() * 100 if len(chase_innings) > 0 else 50

    # ── Dismissal Pattern ──
    batter_wickets = batter_deliveries[batter_deliveries['is_wicket'] == 1]
    # Only count dismissals where this batter was dismissed (not run outs of partner)
    batter_dismissed_df = batter_deliveries[
        (batter_deliveries['is_wicket'] == 1) &
        (batter_deliveries['player_dismissed'] == batter_name)
    ]
    total_dismissals_typed = len(batter_dismissed_df)
    if total_dismissals_typed > 0:
        dismissal_dist = batter_dismissed_df['wicket_kind'].value_counts(normalize=True) * 100
        caught_pct = dismissal_dist.get('caught', 0) + dismissal_dist.get('caught and bowled', 0)
        bowled_pct = dismissal_dist.get('bowled', 0)
        lbw_pct = dismissal_dist.get('lbw', 0)
        stumped_pct = dismissal_dist.get('stumped', 0)
        runout_pct = dismissal_dist.get('run out', 0)
    else:
        caught_pct = bowled_pct = lbw_pct = stumped_pct = runout_pct = 0

    # ── Season Trajectory (slope of SR over seasons) ──
    season_stats = group.groupby('season_year').agg(
        s_runs=('runs', 'sum'), s_balls=('balls', 'sum'), s_innings=('runs', 'count')
    ).reset_index()
    season_stats['s_sr'] = season_stats['s_runs'] / season_stats['s_balls'].clip(1) * 100
    season_stats = season_stats[season_stats['s_innings'] >= 3]  # Min 3 innings per season

    if len(season_stats) >= 3:
        slope, _, _, _, _ = scipy_stats.linregress(
            range(len(season_stats)), season_stats['s_sr'].values
        )
        if slope > 2:
            trend = 'improving'
        elif slope < -2:
            trend = 'declining'
        else:
            trend = 'stable'
        trend_slope = round(slope, 2)
    else:
        trend = 'insufficient_data'
        trend_slope = 0.0

    # ── T20 Archetype Classification ──
    if death_sr > 155 and acceleration > 1.15:
        archetype = 'Finisher'
    elif pp_sr > 145 and intent_score > 140:
        archetype = 'Aggressor'
    elif overall_avg > 30 and consistency > 0.35 and overall_sr < 135:
        archetype = 'Anchor'
    elif overall_avg > 25 and overall_sr > 130 and consistency > 0.25:
        archetype = 'All-Phase'
    elif overall_sr < 120 and dot_pct > 40:
        archetype = 'Accumulator'
    elif death_sr > 145:
        archetype = 'Finisher'
    elif pp_sr > 140:
        archetype = 'Aggressor'
    elif overall_avg > 28:
        archetype = 'Anchor'
    else:
        archetype = 'Utility'

    # ── Overall Scouting Score (0-100) ──
    # Weighted formula: SR (25%) + Avg (20%) + Consistency (15%) + Intent (10%)
    # + Acceleration (10%) + Boundary% (10%) + Pressure (10%)
    sr_score = min(overall_sr / 160 * 100, 100) * 0.25
    avg_score = min(overall_avg / 40 * 100, 100) * 0.20
    consistency_score = consistency * 100 * 0.15
    intent_norm = min(intent_score / 160 * 100, 100) * 0.10
    accel_norm = min(acceleration / 1.5 * 100, 100) * 0.10
    boundary_norm = min(boundary_pct / 30 * 100, 100) * 0.10
    pressure_norm = min(pressure_sr / 150 * 100, 100) * 0.10

    scouting_score = round(sr_score + avg_score + consistency_score +
                           intent_norm + accel_norm + boundary_norm + pressure_norm, 1)
    scouting_score = min(scouting_score, 100)

    # ── First and last season (for career span / age proxy) ──
    first_season = group['season_year'].min()
    last_season = group['season_year'].max()
    career_span = last_season - first_season + 1

    batter_profiles.append({
        'batter': batter_name,
        'total_runs': total_runs,
        'total_balls': total_balls,
        'total_innings': total_innings,
        'total_dismissals': total_dismissed,
        'overall_sr': round(overall_sr, 2),
        'overall_avg': round(overall_avg, 2),
        'boundary_pct': round(boundary_pct, 2),
        'dot_pct': round(dot_pct, 2),
        'total_fours': total_fours,
        'total_sixes': total_sixes,
        # Phase
        'pp_sr': round(pp_sr, 2), 'pp_runs': pp_runs,
        'mid_sr': round(mid_sr, 2), 'mid_runs': mid_runs,
        'death_sr': round(death_sr, 2), 'death_runs': death_runs,
        # Spin vs Pace
        'sr_vs_spin': round(sr_vs_spin, 2),
        'sr_vs_pace': round(sr_vs_pace, 2),
        'avg_vs_spin': round(avg_vs_spin, 2),
        'avg_vs_pace': round(avg_vs_pace, 2),
        # Advanced
        'intent_score': round(intent_score, 2),
        'acceleration_index': round(acceleration, 3),
        'pressure_sr': round(pressure_sr, 2),
        'consistency': round(consistency, 3),
        # Chase vs Defend
        'chase_sr': round(chase_sr, 2),
        'chase_avg': round(chase_avg, 2),
        'defend_sr': round(defend_sr, 2),
        'defend_avg': round(defend_avg, 2),
        'chase_win_pct': round(chase_win_pct, 1),
        # Dismissals
        'caught_pct': round(caught_pct, 1),
        'bowled_pct': round(bowled_pct, 1),
        'lbw_pct': round(lbw_pct, 1),
        'stumped_pct': round(stumped_pct, 1),
        'runout_pct': round(runout_pct, 1),
        # Trend
        'season_trend': trend,
        'trend_slope': trend_slope,
        # Classification
        'archetype': archetype,
        'scouting_score': scouting_score,
        # Meta
        'first_season': first_season,
        'last_season': last_season,
        'career_span': career_span,
        # Last 10
        'last10_avg': round(last10_avg, 2),
        'last10_sr': round(last10_sr, 2),
        'last10_scores': str(last10_runs),
    })

batter_df = pd.DataFrame(batter_profiles)
print(f"   ✅ {len(batter_df)} batter profiles computed")

# ══════════════════════════════════════════════════════════════
# STEP 4: BOWLER ADVANCED METRICS
# ══════════════════════════════════════════════════════════════
print("\n🎳 Computing bowler advanced metrics...")

bowler_profiles = []

for bowler_name, bgroup in deliveries.groupby('bowler'):
    total_b_balls = len(bgroup)
    if total_b_balls < 60:  # Minimum 10 overs bowled
        continue

    total_runs_conceded = bgroup['runs_total'].sum()
    total_wickets = bgroup['is_wicket'].sum()
    total_dots_b = bgroup['is_dot'].sum()
    total_wides = bgroup['is_wide'].sum()
    total_noballs = bgroup['is_noball'].sum()
    total_fours_conceded = bgroup['is_boundary_4'].sum()
    total_sixes_conceded = bgroup['is_boundary_6'].sum()

    overs = total_b_balls / 6
    economy = total_runs_conceded / max(overs, 1)
    bowling_sr = total_b_balls / max(total_wickets, 1)
    dot_pct_b = total_dots_b / max(total_b_balls, 1) * 100
    wicket_pct = total_wickets / max(total_b_balls, 1) * 100
    boundary_conceded_pct = (total_fours_conceded + total_sixes_conceded) / max(total_b_balls, 1) * 100

    # Control index: lower = better control
    control_index = (total_wides + total_noballs) / max(total_b_balls, 1) * 100

    # ── Phase-wise ──
    pp_b = bgroup[bgroup['phase'] == 'powerplay']
    mid_b = bgroup[bgroup['phase'] == 'middle']
    death_b = bgroup[bgroup['phase'] == 'death']

    pp_econ = pp_b['runs_total'].sum() / max(len(pp_b) / 6, 1) if len(pp_b) > 0 else 0
    mid_econ = mid_b['runs_total'].sum() / max(len(mid_b) / 6, 1) if len(mid_b) > 0 else 0
    death_econ = death_b['runs_total'].sum() / max(len(death_b) / 6, 1) if len(death_b) > 0 else 0

    pp_wkts = int(pp_b['is_wicket'].sum())
    mid_wkts = int(mid_b['is_wicket'].sum())
    death_wkts = int(death_b['is_wicket'].sum())

    pp_dot_pct = pp_b['is_dot'].sum() / max(len(pp_b), 1) * 100 if len(pp_b) > 0 else 0
    mid_dot_pct = mid_b['is_dot'].sum() / max(len(mid_b), 1) * 100 if len(mid_b) > 0 else 0
    death_dot_pct = death_b['is_dot'].sum() / max(len(death_b), 1) * 100 if len(death_b) > 0 else 0

    # ── Death Specialist Score (0-100) ──
    if len(death_b) >= 30:
        death_spec = (
            min(death_wkts / 10, 1) * 30 +           # wicket volume
            min(death_dot_pct / 50, 1) * 30 +         # dot ball ability
            max(0, (10 - death_econ)) / 10 * 40       # economy control
        )
        death_specialist = round(min(death_spec, 100), 1)
    else:
        death_specialist = 0

    # ── Powerplay Specialist Score (0-100) ──
    if len(pp_b) >= 30:
        pp_spec = (
            min(pp_wkts / 8, 1) * 30 +
            min(pp_dot_pct / 50, 1) * 30 +
            max(0, (9 - pp_econ)) / 9 * 40
        )
        pp_specialist = round(min(pp_spec, 100), 1)
    else:
        pp_specialist = 0

    # ── Wicket Type Distribution ──
    bowler_wkt_df = bgroup[(bgroup['is_wicket'] == 1) & (bgroup['wicket_kind'].notna())]
    if len(bowler_wkt_df) > 0:
        wkt_dist = bowler_wkt_df['wicket_kind'].value_counts(normalize=True) * 100
        b_caught_pct = wkt_dist.get('caught', 0) + wkt_dist.get('caught and bowled', 0)
        b_bowled_pct = wkt_dist.get('bowled', 0)
        b_lbw_pct = wkt_dist.get('lbw', 0)
        b_stumped_pct = wkt_dist.get('stumped', 0)
    else:
        b_caught_pct = b_bowled_pct = b_lbw_pct = b_stumped_pct = 0

    # ── Pressure Bowling: economy when defending < 150 ──
    # Identify 1st innings matches where total was low
    low_total_matches = deliveries.groupby(['match_id', 'inning']).agg(
        total=('runs_total', 'sum')
    ).reset_index()
    low_total_1st = low_total_matches[
        (low_total_matches['inning'] == 1) & (low_total_matches['total'] < 150)
    ]['match_id'].tolist()
    pressure_bowling = bgroup[
        (bgroup['match_id'].isin(low_total_1st)) & (bgroup['inning'] == 2)
    ]
    pressure_econ = (pressure_bowling['runs_total'].sum() /
                     max(len(pressure_bowling) / 6, 1)) if len(pressure_bowling) >= 12 else economy

    # ── Season Trend ──
    bowler_season = bgroup.groupby('season_year').agg(
        s_balls=('runs_total', 'count'),
        s_runs=('runs_total', 'sum'),
        s_wkts=('is_wicket', 'sum'),
    ).reset_index()
    bowler_season['s_econ'] = bowler_season['s_runs'] / (bowler_season['s_balls'] / 6).clip(1)
    bowler_season = bowler_season[bowler_season['s_balls'] >= 30]

    if len(bowler_season) >= 3:
        b_slope, _, _, _, _ = scipy_stats.linregress(
            range(len(bowler_season)), bowler_season['s_econ'].values
        )
        # For bowlers, negative slope = improving (lower economy)
        if b_slope < -0.3:
            b_trend = 'improving'
        elif b_slope > 0.3:
            b_trend = 'declining'
        else:
            b_trend = 'stable'
        b_trend_slope = round(b_slope, 2)
    else:
        b_trend = 'insufficient_data'
        b_trend_slope = 0.0

    # ── Bowler Type ──
    b_type = BOWLER_TYPES.get(bowler_name, 'pace')

    # ── Bowler Archetype ──
    if death_specialist > 60 and death_econ < 9:
        b_archetype = 'Death Specialist'
    elif pp_specialist > 60 and pp_econ < 8:
        b_archetype = 'Powerplay Specialist'
    elif wicket_pct > 5 and bowling_sr < 18:
        b_archetype = 'Strike Bowler'
    elif economy < 7.5 and dot_pct_b > 40:
        b_archetype = 'Defensive'
    elif death_specialist > 40 and pp_specialist > 40:
        b_archetype = 'All-Phase'
    else:
        b_archetype = 'Utility'

    # ── Overall Scouting Score (0-100) ──
    econ_score_b = max(0, (10 - economy)) / 10 * 100 * 0.30
    wkt_score_b = min(wicket_pct / 7, 1) * 100 * 0.20
    dot_score_b = min(dot_pct_b / 50, 1) * 100 * 0.15
    control_score_b = max(0, (5 - control_index)) / 5 * 100 * 0.10
    death_score_b = death_specialist * 0.15
    pressure_score_b = max(0, (10 - pressure_econ)) / 10 * 100 * 0.10

    b_scouting = round(econ_score_b + wkt_score_b + dot_score_b +
                        control_score_b + death_score_b + pressure_score_b, 1)
    b_scouting = min(b_scouting, 100)

    # Career span
    b_first_season = bgroup['season_year'].min()
    b_last_season = bgroup['season_year'].max()

    bowler_profiles.append({
        'bowler': bowler_name,
        'total_balls': total_b_balls,
        'total_runs_conceded': total_runs_conceded,
        'total_wickets': int(total_wickets),
        'total_dots': int(total_dots_b),
        'economy': round(economy, 2),
        'bowling_sr': round(bowling_sr, 2),
        'dot_pct': round(dot_pct_b, 2),
        'wicket_pct': round(wicket_pct, 2),
        'boundary_conceded_pct': round(boundary_conceded_pct, 2),
        'control_index': round(control_index, 2),
        'total_wides': int(total_wides),
        'total_noballs': int(total_noballs),
        # Phase
        'pp_economy': round(pp_econ, 2),
        'pp_wickets': pp_wkts,
        'pp_dot_pct': round(pp_dot_pct, 2),
        'mid_economy': round(mid_econ, 2),
        'mid_wickets': mid_wkts,
        'mid_dot_pct': round(mid_dot_pct, 2),
        'death_economy': round(death_econ, 2),
        'death_wickets': death_wkts,
        'death_dot_pct': round(death_dot_pct, 2),
        # Specialist scores
        'death_specialist_score': death_specialist,
        'pp_specialist_score': pp_specialist,
        # Wicket types
        'caught_pct': round(b_caught_pct, 1),
        'bowled_pct': round(b_bowled_pct, 1),
        'lbw_pct': round(b_lbw_pct, 1),
        'stumped_pct': round(b_stumped_pct, 1),
        # Pressure
        'pressure_economy': round(pressure_econ, 2),
        # Trend
        'season_trend': b_trend,
        'trend_slope': b_trend_slope,
        # Classification
        'bowler_type': b_type,
        'archetype': b_archetype,
        'scouting_score': b_scouting,
        # Meta
        'first_season': b_first_season,
        'last_season': b_last_season,
        'career_span': b_last_season - b_first_season + 1,
    })

bowler_df = pd.DataFrame(bowler_profiles)
print(f"   ✅ {len(bowler_df)} bowler profiles computed")

# ══════════════════════════════════════════════════════════════
# STEP 5: SEASON TRENDS (per player per season)
# ══════════════════════════════════════════════════════════════
print("\n📈 Computing season-by-season trends...")

# Batter season trends
bat_season = batter_innings.groupby(['batter', 'season_year']).agg(
    runs=('runs', 'sum'),
    balls=('balls', 'sum'),
    innings=('runs', 'count'),
    dismissals=('dismissed', 'sum'),
    fours=('fours', 'sum'),
    sixes=('sixes', 'sum'),
).reset_index()
bat_season['sr'] = bat_season['runs'] / bat_season['balls'].clip(1) * 100
bat_season['avg'] = bat_season['runs'] / bat_season['dismissals'].clip(1)
bat_season['boundary_pct'] = (bat_season['fours'] + bat_season['sixes']) / bat_season['balls'].clip(1) * 100
bat_season['role'] = 'batter'
bat_season = bat_season.rename(columns={'batter': 'player'})

# Bowler season trends
bowl_season = deliveries.groupby(['bowler', 'season_year']).agg(
    balls=('runs_total', 'count'),
    runs_conceded=('runs_total', 'sum'),
    wickets=('is_wicket', 'sum'),
    dots=('is_dot', 'sum'),
).reset_index()
bowl_season['economy'] = bowl_season['runs_conceded'] / (bowl_season['balls'] / 6).clip(1)
bowl_season['bowling_sr'] = bowl_season['balls'] / bowl_season['wickets'].clip(1)
bowl_season['dot_pct'] = bowl_season['dots'] / bowl_season['balls'].clip(1) * 100
bowl_season['role'] = 'bowler'
bowl_season = bowl_season.rename(columns={'bowler': 'player'})

# Combine
season_trends = pd.concat([
    bat_season[['player', 'season_year', 'runs', 'balls', 'innings', 'sr', 'avg', 'boundary_pct', 'role']],
    bowl_season[['player', 'season_year', 'balls', 'runs_conceded', 'wickets', 'economy', 'bowling_sr', 'dot_pct', 'role']],
], ignore_index=True, sort=False)

print(f"   ✅ {len(season_trends)} season-trend entries computed")

# ══════════════════════════════════════════════════════════════
# STEP 6: SAVE OUTPUTS
# ══════════════════════════════════════════════════════════════
print("\n💾 Saving output files...")

batter_df.to_csv('auction_batter_profiles.csv', index=False)
bowler_df.to_csv('auction_bowler_profiles.csv', index=False)
season_trends.to_csv('auction_season_trends.csv', index=False)

print(f"   ✅ auction_batter_profiles.csv  ({len(batter_df)} rows, {len(batter_df.columns)} cols)")
print(f"   ✅ auction_bowler_profiles.csv   ({len(bowler_df)} rows, {len(bowler_df.columns)} cols)")
print(f"   ✅ auction_season_trends.csv     ({len(season_trends)} rows)")

# ── Quick validation ──
print("\n🔍 Validation — Top 5 batters by scouting score:")
top5_bat = batter_df.nlargest(5, 'scouting_score')[['batter', 'scouting_score', 'archetype', 'overall_sr', 'overall_avg']]
print(top5_bat.to_string(index=False))

print("\n🔍 Validation — Top 5 bowlers by scouting score:")
top5_bowl = bowler_df.nlargest(5, 'scouting_score')[['bowler', 'scouting_score', 'archetype', 'economy', 'total_wickets']]
print(top5_bowl.to_string(index=False))

# Spot check
kohli = batter_df[batter_df['batter'] == 'V Kohli']
if not kohli.empty:
    k = kohli.iloc[0]
    print(f"\n🏏 V Kohli: {int(k['total_runs'])} runs, SR {k['overall_sr']}, "
          f"Avg {k['overall_avg']}, Archetype: {k['archetype']}, Score: {k['scouting_score']}")

bumrah = bowler_df[bowler_df['bowler'] == 'JJ Bumrah']
if not bumrah.empty:
    b = bumrah.iloc[0]
    print(f"🎳 JJ Bumrah: {b['total_wickets']} wkts, Econ {b['economy']}, "
          f"Archetype: {b['archetype']}, Score: {b['scouting_score']}")

print("\n✅ Pipeline complete! Data ready for Auction Intelligence module.")
