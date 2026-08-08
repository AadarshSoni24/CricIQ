

import math

# Dictionary mapping features to positive (favors the team) and negative (disfavors the team) templates.
FEATURE_TEMPLATES = {
    # ── Toss & Match Context ──────────────────────────────
    "toss_bat_first": {
        "pos": "Choosing to bat first fits {team}'s historical preference",
        "neg": "Choosing to field first goes against {team}'s typical strategy"
    },
    "toss_winner_is_team1": {
        "pos": "Winning the toss gives {team} a vital tactical advantage",
        "neg": "Losing the toss puts {team} on the back foot early"
    },
    "dew_factor": {
        "pos": "The dew factor at this venue is expected to favor {team}'s second-innings chase",
        "neg": "Heavy dew makes defending a score harder for {team}"
    },
    "season_year": {
        "pos": "{team} has historical momentum from this season cycle",
        "neg": "Recent team restructures this season favor {team}'s opponents"
    },

    # ── Venue & Conditions ─────────────────────────────────
    "avg_1st_innings": {
        "pos": "The high-scoring nature of the venue plays into {team}'s explosive batting style",
        "neg": "The low-scoring, sluggish track favors {team}'s disciplined bowling"
    },
    "bat_first_win_pct": {
        "pos": "Strong bat-first win rates at this venue favor {team}'s preference to set a target",
        "neg": "Historical chase-friendliness at this venue favors {team}'s chasing strength"
    },
    "pitch_dna_enc": {
        "pos": "The pitch characteristics align perfectly with {team}'s lineup balance",
        "neg": "The pitch conditions expose a gap in {team}'s squad balance"
    },
    "ump_spin_bias": {
        "pos": "The officiating umpires have a historical spin bias that favors {team}'s spin department",
        "neg": "Umpiring trends do not favor {team}'s style of play"
    },

    # ── Team Form & Streaks ────────────────────────────────
    "form5": {
        "pos": "{team} enters with strong recent momentum (last 5 matches)",
        "neg": "{team} has struggled for consistency in their last 5 matches"
    },
    "form10": {
        "pos": "{team}'s long-term season stability gives them a solid baseline",
        "neg": "{team}'s long-term form indicates recent performance decay"
    },
    "win_streak": {
        "pos": "{team} is on an active winning streak, boosting team confidence",
        "neg": "{team} is looking to break out of a losing slump"
    },
    "win_pct_season": {
        "pos": "{team}'s high season win percentage shows superior consistency",
        "neg": "{team}'s low season win percentage places them under pressure"
    },
    "home": {
        "pos": "{team} plays in front of a passionate home crowd, boosting performance",
        "neg": "{team} has historically struggled to adapt to this away venue"
    },
    "h2h_winrate": {
        "pos": "{team} enjoys historical dominance in recent head-to-head encounters",
        "neg": "{team} has historically struggled to win against this opponent"
    },
    "is_playoff_zone": {
        "pos": "Crucial playoff qualification pressure motivates {team}'s squad",
        "neg": "The high-stakes playoff context favors {team}'s experienced players"
    },

    # ── Overall Team Base Stats ────────────────────────────
    "team_sr": {
        "pos": "{team}'s high overall batting scoring speed keeps opponents under pressure",
        "neg": "{team}'s low overall scoring rate limits their target setting ability"
    },
    "team_sr_powerplay": {
        "pos": "{team} has a highly explosive top order that dominates the Powerplay",
        "neg": "{team} tends to start conservatively in the first 6 overs"
    },
    "team_sr_death": {
        "pos": "{team}'s middle and lower order excels at scoring rapidly in the death overs",
        "neg": "{team} struggles to accelerate and finish innings strongly"
    },
    "team_economy": {
        "pos": "{team}'s disciplined overall bowling economy chokes the opponent's run rate",
        "neg": "{team}'s bowlers have been expensive overall, leaking runs"
    },
    "team_econ_powerplay": {
        "pos": "{team}'s opening bowlers maintain an incredibly tight line in the Powerplay",
        "neg": "{team} struggles to contain runs in the opening 6 overs"
    },
    "team_econ_death": {
        "pos": "{team} possesses elite death-overs specialist bowlers who contain scoring",
        "neg": "{team}'s death bowling is vulnerable and prone to leaking runs late"
    },
    "bat_win_pct": {
        "pos": "{team} has an outstanding track record when defending a score",
        "neg": "{team} struggles to defend scores when batting first"
    },
    "chase_win_pct": {
        "pos": "{team}'s batting lineup excels at chasing targets under pressure",
        "neg": "{team} has historically struggled in run chases"
    },

    # ── Playing XI-Specific Stats ──────────────────────────
    "xi_bat_sr": {
        "pos": "The selected playing XI for {team} boasts a high collective batting strike rate",
        "neg": "The selected playing XI for {team} has a lower average scoring rate"
    },
    "xi_pp_sr": {
        "pos": "{team}'s selected top order has high Powerplay scoring intent",
        "neg": "{team}'s selected top order has a low Powerplay scoring rate"
    },
    "xi_death_sr": {
        "pos": "{team}'s selected playing XI features proven finishers for the death overs",
        "neg": "{team}'s selected playing XI lacks firepower in the final overs"
    },
    "xi_bowl_econ": {
        "pos": "{team}'s selected bowling unit has a strong, low average economy rate",
        "neg": "{team}'s selected bowling unit is collectively expensive on paper"
    },
    "xi_pp_econ": {
        "pos": "{team}'s chosen Powerplay bowlers are highly effective at restricting runs early",
        "neg": "{team}'s chosen Powerplay bowlers tend to leak runs in the first 6 overs"
    },
    "xi_death_econ": {
        "pos": "{team}'s selected death bowlers are highly efficient at executing yorkers and variations",
        "neg": "{team}'s selected death bowlers struggle to keep the run rate down late in the game"
    },

    # ── Player Matchups & Specialists ──────────────────────
    "matchup_adv": {
        "pos": "{team}'s batters have a distinct matchup advantage against the opponent's bowling styles",
        "neg": "{team}'s lineup is vulnerable to the specific bowling matchups of the opponent"
    },
    "venue_sr": {
        "pos": "{team}'s playing XI has a strong historical track record at this specific venue",
        "neg": "{team}'s key players have historically underperformed on this ground"
    },
    "death_bat_spec": {
        "pos": "{team}'s playing XI has exceptional depth in death-overs batting specialists",
        "neg": "{team}'s playing XI has limited specialized depth for death batting"
    },
    "death_bowl_spec": {
        "pos": "{team}'s playing XI includes elite death-overs bowling specialists",
        "neg": "{team}'s playing XI is short of specialist death bowlers"
    },
    "allrounders": {
        "pos": "Multiple quality all-rounders give {team} incredible tactical flexibility",
        "neg": "A lack of all-rounders reduces {team}'s tactical options"
    },
    "player_form": {
        "pos": "{team}'s selected players are in peak individual form",
        "neg": "Several key players for {team} are currently going through a rough patch"
    },
    "cap_winrate": {
        "pos": "{team}'s captain has a highly successful leadership record",
        "neg": "{team}'s captain has struggled to secure wins under pressure"
    },
    "points": {
        "pos": "{team}'s higher position in the points table reflects their superior season run",
        "neg": "{team}'s lower points standing adds pressure to win"
    },

    # ── Differences (diff_*) ──────────────────────────────
    "diff_xi_bat_sr": {
        "pos": "{team1} has a superior playing XI batting strike rate compared to {team2}",
        "neg": "{team2} has a superior playing XI batting strike rate compared to {team1}"
    },
    "diff_xi_bowl_econ": {
        "pos": "{team1}'s selected bowling unit has a better average economy rate than {team2}'s",
        "neg": "{team2}'s selected bowling unit has a better average economy rate than {team1}'s"
    },
    "diff_player_form": {
        "pos": "{team1}'s squad is in better overall player form than {team2}",
        "neg": "{team2}'s squad is in better overall player form than {team1}"
    },
    "diff_win_streak": {
        "pos": "{team1}'s active winning momentum is superior to {team2}'s",
        "neg": "{team2}'s active winning momentum is superior to {team1}'s"
    },
    "diff_form5": {
        "pos": "{team1} has been in better form over the last 5 matches than {team2}",
        "neg": "{team2} has been in better form over the last 5 matches than {team1}"
    },
    "diff_form10": {
        "pos": "{team1} shows greater long-term form stability than {team2}",
        "neg": "{team2} shows greater long-term form stability than {team1}"
    },
    "diff_matchup_adv": {
        "pos": "{team1} holds a distinct player matchup superiority over {team2}",
        "neg": "{team2} holds a distinct player matchup superiority over {team1}"
    },
    "diff_cap_winrate": {
        "pos": "{team1}'s captain has a higher win rate than {team2}'s captain",
        "neg": "{team2}'s captain has a higher win rate than {team1}'s captain"
    },
    "diff_xi_pp_sr": {
        "pos": "{team1}'s top order is more aggressive in the Powerplay than {team2}'s",
        "neg": "{team2}'s top order is more aggressive in the Powerplay than {team1}'s"
    },
    "diff_xi_death_sr": {
        "pos": "{team1} has a higher death batting strike rate than {team2}",
        "neg": "{team2} has a higher death batting strike rate than {team1}"
    },
    "diff_xi_death_econ": {
        "pos": "{team1}'s death-overs bowling unit is more economical than {team2}'s",
        "neg": "{team2}'s death-overs bowling unit is more economical than {team1}'s"
    },
    "diff_points_diff": {
        "pos": "{team1}'s league standing advantage gives them a psychological edge over {team2}",
        "neg": "{team2}'s league standing advantage gives them a psychological edge over {team1}"
    }
}

def sigmoid(x):
    try:
        return 1.0 / (1.0 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0

def humanize_shap(shap_values, feature_names, team1_name, team2_name, base_value):
    """
    Translates top SHAP values to human-readable explanations.
    Converts raw SHAP values (log-odds) to approximate win-probability delta (percentage points).
    Returns list of dicts: {'factor': str, 'impact_pct': float, 'favors_team': str, 'reason': str}
    """
    total_margin = base_value + sum(shap_values)
    prob_total = sigmoid(total_margin)
    
    reasons = []
    for val, name in zip(shap_values, feature_names):
        if val == 0:
            continue
            
        # Convert SHAP value to probability delta
        margin_without = total_margin - val
        prob_without = sigmoid(margin_without)
        delta_prob = (prob_total - prob_without) * 100  # percentage points change
        
        # Decide which team this favors (positive delta_prob favors Team 1)
        if delta_prob > 0:
            favors_team = team1_name
        else:
            favors_team = team2_name
            
        # Clean prefix to find template
        base_name = name
        prefix = ""
        for p in ["t1b_", "t2b_", "t1_", "t2_", "team1_", "team2_"]:
            if name.startswith(p):
                base_name = name[len(p):]
                prefix = p
                break
                
        # Resolve explanation text using templates
        explanation = ""
        if name in FEATURE_TEMPLATES:
            templates = FEATURE_TEMPLATES[name]
        elif base_name in FEATURE_TEMPLATES:
            templates = FEATURE_TEMPLATES[base_name]
        else:
            templates = None
            
        if templates:
            if name.startswith("diff_"):
                # Differential features use {team1} and {team2}
                if val > 0:
                    explanation = templates["pos"].format(team1=team1_name, team2=team2_name)
                else:
                    explanation = templates["neg"].format(team1=team1_name, team2=team2_name)
            else:
                # Team-specific features
                is_team1 = ("t1_" in prefix or "t1b_" in prefix or "team1_" in prefix)
                is_team2 = ("t2_" in prefix or "t2b_" in prefix or "team2_" in prefix)
                
                if is_team1:
                    if val > 0:  # favors Team 1 (Strength of Team 1)
                        explanation = templates["pos"].format(team=team1_name)
                    else:  # favors Team 2 (Weakness of Team 1)
                        explanation = templates["neg"].format(team=team1_name)
                elif is_team2:
                    if val < 0:  # favors Team 2 (Strength of Team 2)
                        explanation = templates["pos"].format(team=team2_name)
                    else:  # favors Team 1 (Weakness of Team 2)
                        explanation = templates["neg"].format(team=team2_name)
                else:
                    # General match context (like toss_bat_first, dew_factor)
                    if val > 0:
                        explanation = templates["pos"].format(team=team1_name)
                    else:
                        explanation = templates["neg"].format(team=team2_name)
        else:
            # Fallback label generation
            clean_lbl = name.replace("t1b_", f"{team1_name} bowling ").replace("t2b_", f"{team2_name} bowling ")
            clean_lbl = clean_lbl.replace("t1_", f"{team1_name} ").replace("t2_", f"{team2_name} ")
            clean_lbl = clean_lbl.replace("team1_", f"{team1_name} ").replace("team2_", f"{team2_name} ")
            clean_lbl = clean_lbl.replace("_", " ").strip().title()
            explanation = f"{clean_lbl} favors {favors_team}"
            
        reasons.append({
            "factor": name,
            "impact_pct": round(abs(delta_prob), 2),
            "favors_team": favors_team,
            "reason": explanation
        })
        
    # Sort by absolute impact descending
    reasons = sorted(reasons, key=lambda x: x["impact_pct"], reverse=True)
    return reasons
