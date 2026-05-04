import streamlit as st
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import warnings
warnings.filterwarnings('ignore')

# ── Page config ─────────────────────────────────────────────
st.set_page_config(
    page_title="CricIQ — IPL Match Predictor",
    page_icon="🏏",
    layout="wide",
)

# ── Custom CSS ───────────────────────────────────────────────
st.markdown("""
<style>
    .main { background-color: #0f1117; }
    .stApp { background-color: #0f1117; }
    h1 { color: #00d4aa !important; }
    h2, h3 { color: #ffffff !important; }
    .metric-card {
        background: #1e2130;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        border: 1px solid #2d3250;
    }
    .win-bar-container {
        background: #1e2130;
        border-radius: 12px;
        padding: 24px;
        margin: 16px 0;
        border: 1px solid #2d3250;
    }
    .prediction-header {
        font-size: 28px;
        font-weight: bold;
        color: #00d4aa;
        text-align: center;
        padding: 10px;
    }
    .shap-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #2d3250;
        font-size: 14px;
    }
</style>
""", unsafe_allow_html=True)

# ── Load data & model ────────────────────────────────────────
@st.cache_resource
def load_all():
    model        = joblib.load('xgb_match_predictor.pkl')
    feature_cols = joblib.load('feature_cols.pkl')
    venue_f      = pd.read_csv('venue_features.csv')
    bat_f        = pd.read_csv('player_batting_features.csv')
    bowl_f       = pd.read_csv('player_bowling_features.csv')
    matchup      = pd.read_csv('matchup_matrix.csv')
    matches      = pd.read_csv('matches.csv')
    return model, feature_cols, venue_f, bat_f, bowl_f, matchup, matches

model, feature_cols, venue_f, bat_f, bowl_f, matchup, matches = load_all()

# ── Constants ────────────────────────────────────────────────
CURRENT_TEAMS = [
    'Chennai Super Kings', 'Delhi Capitals', 'Gujarat Titans',
    'Kolkata Knight Riders', 'Lucknow Super Giants', 'Mumbai Indians',
    'Punjab Kings', 'Rajasthan Royals', 'Royal Challengers Bengaluru',
    'Sunrisers Hyderabad',
]

MAIN_VENUES = [
    'Wankhede Stadium',
    'MA Chidambaram Stadium',
    'Eden Gardens',
    'M Chinnaswamy Stadium',
    'Arun Jaitley Stadium',
    'Rajiv Gandhi International Stadium',
    'Punjab Cricket Association IS Bindra Stadium',
    'Sawai Mansingh Stadium',
    'Narendra Modi Stadium, Ahmedabad',
    'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
    'Maharashtra Cricket Association Stadium',
    'Himachal Pradesh Cricket Association Stadium',
]

TEAM_COLORS = {
    'Mumbai Indians': '#004BA0',
    'Chennai Super Kings': '#F9CD05',
    'Royal Challengers Bengaluru': '#EC1C24',
    'Kolkata Knight Riders': '#3A225D',
    'Sunrisers Hyderabad': '#F7A721',
    'Delhi Capitals': '#0078BC',
    'Rajasthan Royals': '#EA1A85',
    'Punjab Kings': '#ED1B24',
    'Gujarat Titans': '#1C1C5E',
    'Lucknow Super Giants': '#A72056',
}

# ── Helper: get team form from history ───────────────────────
def get_team_form(team, n=5):
    m = matches[~matches['no_result']].copy().sort_values('date')
    team_m = m[(m['team1']==team)|(m['team2']==team)].tail(n)
    if len(team_m)==0: return 0.5
    return (team_m['winner']==team).sum()/len(team_m)

def get_h2h(team1, team2, venue):
    m = matches[~matches['no_result']].copy()
    h2h = m[
        ((m['team1']==team1)&(m['team2']==team2)) |
        ((m['team1']==team2)&(m['team2']==team1))
    ]
    h2h_v = h2h[h2h['venue'].str.contains(venue.split(',')[0], case=False, na=False)]
    use = h2h_v if len(h2h_v)>=3 else h2h
    if len(use)==0: return 0.5
    return (use['winner']==team1).sum()/len(use)

def get_venue_row(venue):
    row = venue_f[venue_f['venue'].str.contains(venue.split(',')[0], case=False, na=False)]
    if row.empty:
        return {'avg_1st_innings':165.0, 'bat_first_win_pct':0.5, 'pitch_dna':'balanced'}
    return row.iloc[0].to_dict()

def predict(team1, team2, venue, toss_winner, toss_decision):
    vrow   = get_venue_row(venue)
    pitch_map = {'batting_friendly':2,'balanced':1,'bowling_friendly':0}

    t1_form5  = get_team_form(team1, 5)
    t2_form5  = get_team_form(team2, 5)
    t1_form10 = get_team_form(team1, 10)
    t2_form10 = get_team_form(team2, 10)
    h2h_rate  = get_h2h(team1, team2, venue)

    features = pd.DataFrame([{
        'toss_bat_first':        1 if toss_decision=='bat' else 0,
        'toss_winner_is_team1':  1 if toss_winner==team1 else 0,
        'avg_1st_innings':       vrow['avg_1st_innings'],
        'bat_first_win_pct':     vrow['bat_first_win_pct'],
        'pitch_dna_enc':         pitch_map.get(vrow['pitch_dna'],1),
        'team1_form5':           t1_form5,
        'team2_form5':           t2_form5,
        'team1_form10':          t1_form10,
        'team2_form10':          t2_form10,
        'team1_h2h_winrate':     h2h_rate,
        'season_year':           2025,
    }])

    prob = model.predict_proba(features)[0]

    # SHAP
    try:
        import shap
        explainer   = shap.TreeExplainer(model)
        shap_vals   = explainer.shap_values(features)[0]
        shap_info   = list(zip(feature_cols, shap_vals))
        shap_info   = sorted(shap_info, key=lambda x: abs(x[1]), reverse=True)
    except Exception:
        shap_info = []

    context = {
        't1_form5': t1_form5, 't2_form5': t2_form5,
        'h2h_rate': h2h_rate,
        'avg_score': vrow['avg_1st_innings'],
        'pitch_dna': vrow['pitch_dna'],
        'bat_win_pct': vrow['bat_first_win_pct'],
    }
    return prob, shap_info, context

# ── Get matchup data ─────────────────────────────────────────
def get_matchup(bowler, batter):
    row = matchup[(matchup['bowler']==bowler)&(matchup['batter']==batter)]
    if row.empty: return None
    return row.iloc[0].to_dict()

def get_player_bat_stats(name):
    row = bat_f[bat_f['batter']==name]
    if row.empty: return None
    return row.iloc[0].to_dict()

def get_player_bowl_stats(name):
    row = bowl_f[bowl_f['bowler']==name]
    if row.empty: return None
    return row.iloc[0].to_dict()

# ── SHAP label map ───────────────────────────────────────────
SHAP_LABELS = {
    'toss_bat_first':       'Toss decision (bat first)',
    'toss_winner_is_team1': 'Toss won by team',
    'avg_1st_innings':      'Venue avg 1st innings score',
    'bat_first_win_pct':    'Bat first win % at venue',
    'pitch_dna_enc':        'Pitch type (batting/bowling)',
    'team1_form5':          f'Team 1 form (last 5)',
    'team2_form5':          f'Team 2 form (last 5)',
    'team1_form10':         f'Team 1 form (last 10)',
    'team2_form10':         f'Team 2 form (last 10)',
    'team1_h2h_winrate':    'Head-to-head win rate',
    'season_year':          'Season',
}

# ════════════════════════════════════════════════════════════
# MAIN APP
# ════════════════════════════════════════════════════════════

st.markdown("# 🏏 CricIQ — IPL Intelligence Platform")
st.markdown("#### AI-powered match prediction · Player analytics · Matchup explorer")
st.markdown("---")

tab1, tab2, tab3 = st.tabs(["🎯 Match Predictor", "👤 Player Scout", "⚔️ Matchup Explorer"])

# ════════════════════════════════════════════════════════════
# TAB 1 — MATCH PREDICTOR
# ════════════════════════════════════════════════════════════
with tab1:
    st.markdown("### Select match details")

    col1, col2, col3 = st.columns(3)

    with col1:
        team1 = st.selectbox("🔵 Team 1", CURRENT_TEAMS, index=5)  # MI default

    with col2:
        remaining = [t for t in CURRENT_TEAMS if t != team1]
        team2 = st.selectbox("🔴 Team 2", remaining, index=0)  # CSK default

    with col3:
        venue = st.selectbox("🏟️ Venue", MAIN_VENUES)

    col4, col5 = st.columns(2)
    with col4:
        toss_winner = st.selectbox("🪙 Toss won by", [team1, team2])
    with col5:
        toss_decision = st.selectbox("📋 Elected to", ["bat", "field"])

    st.markdown("")
    predict_btn = st.button("🔮 Predict Winner", type="primary", use_container_width=True)

    if predict_btn:
        with st.spinner("Analysing 17 seasons of IPL data..."):
            prob, shap_info, ctx = predict(team1, team2, venue, toss_winner, toss_decision)

        p1 = prob[1] * 100
        p2 = prob[0] * 100
        winner = team1 if p1 > p2 else team2
        conf = max(p1, p2)

        st.markdown("---")

        # Winner banner
        c1 = TEAM_COLORS.get(team1, '#00d4aa')
        c2 = TEAM_COLORS.get(team2, '#e74c3c')
        win_color = c1 if winner == team1 else c2

        st.markdown(f"""
        <div style='background:{win_color}22;border:2px solid {win_color};
             border-radius:16px;padding:20px;text-align:center;margin-bottom:20px'>
            <div style='font-size:14px;color:#aaa;margin-bottom:4px'>PREDICTED WINNER</div>
            <div style='font-size:36px;font-weight:bold;color:{win_color}'>{winner}</div>
            <div style='font-size:18px;color:#ddd'>{conf:.1f}% confidence</div>
        </div>
        """, unsafe_allow_html=True)

        # Win probability bar
        st.markdown("#### Win probability")
        col_a, col_b = st.columns([1,1])
        with col_a:
            st.markdown(f"<div style='text-align:center;font-size:18px;font-weight:bold;color:{c1}'>{team1}</div>", unsafe_allow_html=True)
            st.markdown(f"<div style='text-align:center;font-size:32px;font-weight:bold;color:{c1}'>{p1:.1f}%</div>", unsafe_allow_html=True)
        with col_b:
            st.markdown(f"<div style='text-align:center;font-size:18px;font-weight:bold;color:{c2}'>{team2}</div>", unsafe_allow_html=True)
            st.markdown(f"<div style='text-align:center;font-size:32px;font-weight:bold;color:{c2}'>{p2:.1f}%</div>", unsafe_allow_html=True)

        # Visual probability bar
        fig, ax = plt.subplots(figsize=(10, 1.2))
        fig.patch.set_facecolor('#1e2130')
        ax.set_facecolor('#1e2130')
        ax.barh([0], [p1], color=c1, height=0.6)
        ax.barh([0], [p2], left=[p1], color=c2, height=0.6)
        ax.set_xlim(0,100)
        ax.axis('off')
        ax.text(p1/2, 0, f'{p1:.0f}%', ha='center', va='center',
                fontsize=14, fontweight='bold', color='white')
        ax.text(p1 + p2/2, 0, f'{p2:.0f}%', ha='center', va='center',
                fontsize=14, fontweight='bold', color='white')
        plt.tight_layout(pad=0)
        st.pyplot(fig, use_container_width=True)
        plt.close()

        st.markdown("---")

        # Context metrics
        st.markdown("#### Match context")
        m1, m2c, m3c, m4c = st.columns(4)
        with m1:
            st.metric("Pitch type", ctx['pitch_dna'].replace('_',' ').title())
        with m2c:
            st.metric("Avg 1st innings", f"{ctx['avg_score']:.0f} runs")
        with m3c:
            st.metric("Bat first wins here", f"{ctx['bat_win_pct']*100:.0f}%")
        with m4c:
            st.metric(f"H2H ({team1[:3]} win rate)", f"{ctx['h2h_rate']*100:.0f}%")

        f1, f2 = st.columns(2)
        with f1:
            st.metric(f"{team1} last 5 form", f"{ctx['t1_form5']*100:.0f}% win rate")
        with f2:
            st.metric(f"{team2} last 5 form", f"{ctx['t2_form5']*100:.0f}% win rate")

        # SHAP explanation
        if shap_info:
            st.markdown("---")
            st.markdown("#### Why this prediction? (SHAP factors)")
            st.caption(f"Positive = favours {team1} · Negative = favours {team2}")

            fig2, ax2 = plt.subplots(figsize=(10, 5))
            fig2.patch.set_facecolor('#1e2130')
            ax2.set_facecolor('#1e2130')

            top = shap_info[:8]
            labels = [SHAP_LABELS.get(f, f) for f, _ in top]
            values = [v for _, v in top]
            colors = ['#00d4aa' if v > 0 else '#e74c3c' for v in values]

            bars = ax2.barh(range(len(values)), values, color=colors)
            ax2.set_yticks(range(len(labels)))
            ax2.set_yticklabels(labels, color='white', fontsize=11)
            ax2.axvline(0, color='white', linewidth=0.8, alpha=0.5)
            ax2.set_xlabel('SHAP value (impact on prediction)', color='white')
            ax2.tick_params(colors='white')
            ax2.spines['bottom'].set_color('#444')
            ax2.spines['left'].set_color('#444')
            ax2.spines['top'].set_visible(False)
            ax2.spines['right'].set_visible(False)

            p1_patch = mpatches.Patch(color='#00d4aa', label=f'Favours {team1}')
            p2_patch = mpatches.Patch(color='#e74c3c', label=f'Favours {team2}')
            ax2.legend(handles=[p1_patch, p2_patch], facecolor='#1e2130',
                      labelcolor='white', fontsize=10)

            plt.tight_layout()
            st.pyplot(fig2, use_container_width=True)
            plt.close()

# ════════════════════════════════════════════════════════════
# TAB 2 — PLAYER SCOUT
# ════════════════════════════════════════════════════════════
with tab2:
    st.markdown("### Player scout")

    all_batters  = sorted(bat_f['batter'].unique().tolist())
    all_bowlers  = sorted(bowl_f['bowler'].unique().tolist())

    col1, col2 = st.columns(2)
    with col1:
        selected_batter = st.selectbox("🏏 Select batter", all_batters,
                                        index=all_batters.index('V Kohli') if 'V Kohli' in all_batters else 0)
    with col2:
        selected_bowler = st.selectbox("🎳 Select bowler", all_bowlers,
                                        index=all_bowlers.index('JJ Bumrah') if 'JJ Bumrah' in all_bowlers else 0)

    b_col, bow_col = st.columns(2)

    # Batter stats
    with b_col:
        bs = get_player_bat_stats(selected_batter)
        if bs:
            st.markdown(f"#### {selected_batter} — Batting")
           runs_col = 'runs' if 'runs' in bs else 'bat_runs' if 'bat_runs' in bs else list(bs.keys())[1]
           sr_col   = 'sr'   if 'sr'   in bs else 'bat_sr'   if 'bat_sr'   in bs else 'strike_rate'
           avg_col  = 'avg'  if 'avg'  in bs else 'bat_avg'  if 'bat_avg'  in bs else 'average'

st.metric("Total IPL runs", f"{int(bs.get(runs_col, 0)):,}")

m1, m2c = st.columns(2)
m1.metric("Overall SR",  f"{bs.get(sr_col,  0):.1f}")
m2c.metric("Overall Avg", f"{bs.get(avg_col, 0):.1f}")

            # Phase breakdown chart
            phases = ['Powerplay', 'Middle', 'Death']
            srs = [
                bs.get('sr_powerplay', 0) or 0,
                bs.get('sr_middle', 0) or 0,
                bs.get('sr_death', 0) or 0,
            ]
            fig, ax = plt.subplots(figsize=(6, 3))
            fig.patch.set_facecolor('#1e2130')
            ax.set_facecolor('#1e2130')
            colors_p = ['#f39c12','#3498db','#e74c3c']
            bars = ax.bar(phases, srs, color=colors_p, width=0.5)
            for bar, val in zip(bars, srs):
                if val > 0:
                    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+2,
                            f'{val:.0f}', ha='center', color='white', fontsize=11, fontweight='bold')
            ax.set_ylabel('Strike Rate', color='white')
            ax.set_title(f'{selected_batter} — SR by Phase', color='white', fontsize=12)
            ax.tick_params(colors='white')
            for spine in ax.spines.values(): spine.set_color('#444')
            ax.set_facecolor('#1e2130')
            plt.tight_layout()
            st.pyplot(fig, use_container_width=True)
            plt.close()

            st.caption(f"Boundary %: {bs.get('boundary_pct',0):.1f}% | "
                      f"Dot ball %: {bs.get('dot_pct',0):.1f}% | "
                      f"Innings: {int(bs.get('innings',0))}")

    # Bowler stats
    with bow_col:
        bws = get_player_bowl_stats(selected_bowler)
        if bws:
            st.markdown(f"#### {selected_bowler} — Bowling")
            st.metric("Total IPL wickets", f"{int(bws['wickets'])}")

            m1, m2c = st.columns(2)
            m1.metric("Economy", f"{bws['economy']:.2f}")
            m2c.metric("Dot ball %", f"{bws['dot_pct']:.1f}%")

            # Phase economy chart
            phases = ['Powerplay', 'Middle', 'Death']
            econs = [
                bws.get('economy_powerplay', 0) or 0,
                bws.get('economy_middle', 0) or 0,
                bws.get('economy_death', 0) or 0,
            ]
            fig, ax = plt.subplots(figsize=(6, 3))
            fig.patch.set_facecolor('#1e2130')
            ax.set_facecolor('#1e2130')
            colors_p = ['#f39c12','#3498db','#e74c3c']
            bars = ax.bar(phases, econs, color=colors_p, width=0.5)
            for bar, val in zip(bars, econs):
                if val > 0:
                    ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.1,
                            f'{val:.1f}', ha='center', color='white', fontsize=11, fontweight='bold')
            ax.set_ylabel('Economy Rate', color='white')
            ax.set_title(f'{selected_bowler} — Economy by Phase', color='white', fontsize=12)
            ax.tick_params(colors='white')
            for spine in ax.spines.values(): spine.set_color('#444')
            ax.set_facecolor('#1e2130')
            plt.tight_layout()
            st.pyplot(fig, use_container_width=True)
            plt.close()

            st.caption(f"Bowling SR: {bws.get('bowl_sr',0):.1f} | "
                      f"Total balls: {int(bws.get('balls',0)):,}")

# ════════════════════════════════════════════════════════════
# TAB 3 — MATCHUP EXPLORER
# ════════════════════════════════════════════════════════════
with tab3:
    st.markdown("### ⚔️ Bowler vs Batter matchup explorer")
    st.caption("Find out how any bowler performs against any batter from 17 seasons of IPL data")

    c1, c2 = st.columns(2)
    with c1:
        m_bowler = st.selectbox("🎳 Bowler", all_bowlers,
                                 index=all_bowlers.index('JJ Bumrah') if 'JJ Bumrah' in all_bowlers else 0)
    with c2:
        m_batter = st.selectbox("🏏 Batter", all_batters,
                                 index=all_batters.index('V Kohli') if 'V Kohli' in all_batters else 0)

    if st.button("🔍 Analyse Matchup", use_container_width=True):
        mx_data = get_matchup(m_bowler, m_batter)

        if mx_data is None:
            st.warning(f"Not enough data for {m_bowler} vs {m_batter} (need at least 6 balls faced)")
        else:
            balls = int(mx_data['balls'])
            runs  = int(mx_data['runs'])
            dismi = int(mx_data['dismissals'])
            sr    = mx_data['sr']
            econ  = mx_data['economy']
            dism_pct = mx_data['dismissal_pct']
            dot_pct  = mx_data['dot_pct']
            bdry_pct = mx_data['boundary_pct']

            # Advantage verdict
            if dism_pct > 10 or (sr < 100 and dot_pct > 40):
                verdict = f"🟢 BOWLER DOMINATES — {m_bowler} has the edge"
                v_color = "#00d4aa"
            elif sr > 160 or bdry_pct > 35:
                verdict = f"🔴 BATTER DOMINATES — {m_batter} has the edge"
                v_color = "#e74c3c"
            else:
                verdict = "🟡 EVEN CONTEST — closely matched"
                v_color = "#f39c12"

            st.markdown(f"""
            <div style='background:{v_color}22;border:2px solid {v_color};
                 border-radius:12px;padding:16px;text-align:center;margin:16px 0'>
                <div style='font-size:20px;font-weight:bold;color:{v_color}'>{verdict}</div>
                <div style='color:#aaa;margin-top:4px'>Based on {balls} balls in IPL history</div>
            </div>
            """, unsafe_allow_html=True)

            # Stats grid
            c1, c2, c3, c4, c5 = st.columns(5)
            c1.metric("Balls", balls)
            c2.metric("Runs", runs)
            c3.metric("Dismissals", dismi)
            c4.metric("Strike Rate", f"{sr:.1f}")
            c5.metric("Dismissal %", f"{dism_pct:.1f}%")

            c6, c7, c8 = st.columns(3)
            c6.metric("Economy", f"{econ:.2f}")
            c7.metric("Dot ball %", f"{dot_pct:.1f}%")
            c8.metric("Boundary %", f"{bdry_pct:.1f}%")

            # Visual breakdown
            fig, axes = plt.subplots(1, 3, figsize=(12, 3))
            fig.patch.set_facecolor('#1e2130')

            for ax in axes:
                ax.set_facecolor('#1e2130')
                for spine in ax.spines.values():
                    spine.set_color('#444')
                ax.tick_params(colors='white')

            # Runs breakdown
            labels1 = ['Dot balls', 'Singles', 'Boundaries']
            dots_r  = int(mx_data['dots'])
            bdry_r  = int(mx_data['fours']) + int(mx_data['sixes'])
            singles = max(0, balls - dots_r - bdry_r)
            vals1   = [dots_r, singles, bdry_r]
            axes[0].pie(vals1, labels=labels1, autopct='%1.0f%%',
                       colors=['#555','#3498db','#e74c3c'],
                       textprops={'color':'white','fontsize':10})
            axes[0].set_title('Ball breakdown', color='white', fontsize=11)

            # Comparison bar
            metrics = ['SR', 'Dot%', 'Dismissal%']
            values  = [sr, dot_pct, dism_pct]
            colors_b= ['#3498db','#f39c12','#e74c3c']
            axes[1].bar(metrics, values, color=colors_b, width=0.5)
            axes[1].set_title('Key metrics', color='white', fontsize=11)
            axes[1].set_ylabel('Value', color='white')

            # Over breakdown if available — just show summary text
            axes[2].text(0.5, 0.6, f"{m_bowler}", ha='center', va='center',
                        fontsize=13, color='#3498db', fontweight='bold',
                        transform=axes[2].transAxes)
            axes[2].text(0.5, 0.45, "vs", ha='center', va='center',
                        fontsize=16, color='white', transform=axes[2].transAxes)
            axes[2].text(0.5, 0.3, f"{m_batter}", ha='center', va='center',
                        fontsize=13, color='#e74c3c', fontweight='bold',
                        transform=axes[2].transAxes)
            axes[2].text(0.5, 0.15, f"{runs} runs off {balls} balls",
                        ha='center', va='center', fontsize=11, color='#aaa',
                        transform=axes[2].transAxes)
            axes[2].axis('off')
            axes[2].set_title('Summary', color='white', fontsize=11)

            plt.tight_layout()
            st.pyplot(fig, use_container_width=True)
            plt.close()

# ── Footer ───────────────────────────────────────────────────
st.markdown("---")
st.markdown(
    "<div style='text-align:center;color:#666;font-size:12px'>"
    "CricIQ · Built on 1,175 IPL matches · 279,586 deliveries · 2008–2026 · Phase 2"
    "</div>",
    unsafe_allow_html=True
)
