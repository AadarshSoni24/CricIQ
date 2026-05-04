import streamlit as st
import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import warnings
warnings.filterwarnings('ignore')

# ── Page config ──────────────────────────────────────────────
st.set_page_config(
    page_title="CricIQ — IPL Intelligence Platform",
    page_icon="🏏",
    layout="wide",
)

# ── IPL Blue + Orange CSS ────────────────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

    html, body, .stApp { background-color: #0A1628 !important; font-family: 'Inter', sans-serif; }
    .main { background-color: #0A1628; }

    /* Hide streamlit default elements */
    #MainMenu, footer, header { visibility: hidden; }

    /* Header */
    .criciq-header {
        background: linear-gradient(135deg, #0A1628 0%, #1B2B4B 50%, #0A1628 100%);
        border-bottom: 2px solid #FF6B00;
        padding: 20px 0 16px 0;
        margin-bottom: 24px;
        text-align: center;
    }
    .criciq-title {
        font-size: 42px; font-weight: 800;
        background: linear-gradient(90deg, #1B4FD8, #FF6B00);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        letter-spacing: -1px;
    }
    .criciq-sub { color: #8899BB; font-size: 15px; margin-top: 4px; }

    /* Cards */
    .card {
        background: #111E35;
        border: 1px solid #1E3A5F;
        border-radius: 14px;
        padding: 20px;
    }
    .card-orange {
        background: linear-gradient(135deg, #FF6B0015, #111E35);
        border: 1px solid #FF6B0055;
        border-radius: 14px;
        padding: 20px;
    }
    .card-blue {
        background: linear-gradient(135deg, #1B4FD815, #111E35);
        border: 1px solid #1B4FD855;
        border-radius: 14px;
        padding: 20px;
    }

    /* Winner banner */
    .winner-banner {
        border-radius: 16px;
        padding: 28px;
        text-align: center;
        margin: 20px 0;
    }
    .winner-label { font-size: 12px; letter-spacing: 3px; color: #8899BB; text-transform: uppercase; }
    .winner-name  { font-size: 40px; font-weight: 800; margin: 8px 0; }
    .winner-conf  { font-size: 18px; color: #ccc; }

    /* Insight cards */
    .insight-card {
        background: #111E35;
        border: 1px solid #1E3A5F;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
    }
    .insight-label { font-size: 11px; color: #8899BB; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
    .insight-value { font-size: 22px; font-weight: 700; color: #ffffff; }
    .insight-sub   { font-size: 12px; color: #8899BB; margin-top: 4px; }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        background: #111E35;
        border-radius: 12px;
        padding: 4px;
        gap: 4px;
        border: 1px solid #1E3A5F;
    }
    .stTabs [data-baseweb="tab"] {
        background: transparent;
        color: #8899BB;
        border-radius: 8px;
        font-weight: 600;
        padding: 8px 20px;
    }
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #1B4FD8, #FF6B00) !important;
        color: white !important;
    }

    /* Selectbox + inputs */
    .stSelectbox > div > div {
        background: #111E35 !important;
        border: 1px solid #1E3A5F !important;
        border-radius: 10px !important;
        color: white !important;
    }
    .stMultiSelect > div > div {
        background: #111E35 !important;
        border: 1px solid #1E3A5F !important;
        border-radius: 10px !important;
    }

    /* Buttons */
    .stButton > button {
        background: linear-gradient(135deg, #1B4FD8, #FF6B00) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        font-weight: 700 !important;
        font-size: 16px !important;
        padding: 12px 0 !important;
        transition: opacity 0.2s;
    }
    .stButton > button:hover { opacity: 0.88; }

    /* Metrics */
    [data-testid="metric-container"] {
        background: #111E35;
        border: 1px solid #1E3A5F;
        border-radius: 12px;
        padding: 14px 18px;
    }
    [data-testid="metric-container"] label { color: #8899BB !important; font-size: 12px !important; }
    [data-testid="metric-container"] [data-testid="stMetricValue"] { color: #ffffff !important; font-weight: 700 !important; }

    /* Section headers */
    .section-title {
        font-size: 18px; font-weight: 700; color: #ffffff;
        border-left: 3px solid #FF6B00;
        padding-left: 12px;
        margin: 24px 0 14px 0;
    }

    /* Team badge */
    .team-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
    }

    /* Divider */
    hr { border-color: #1E3A5F !important; }

    /* H2H record */
    .h2h-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        border-radius: 8px;
        margin: 4px 0;
        font-size: 14px;
        color: #ccc;
    }
    .h2h-win  { background: #00C85115; border-left: 3px solid #00C851; }
    .h2h-loss { background: #FF3D3D15; border-left: 3px solid #FF3D3D; }

    /* Footer */
    .criciq-footer {
        text-align: center;
        padding: 20px;
        color: #3A5070;
        font-size: 12px;
        border-top: 1px solid #1E3A5F;
        margin-top: 40px;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0A1628; }
    ::-webkit-scrollbar-thumb { background: #1B4FD8; border-radius: 3px; }
</style>
""", unsafe_allow_html=True)

# ── Header ───────────────────────────────────────────────────
st.markdown("""
<div class='criciq-header'>
    <div class='criciq-title'>🏏 CricIQ</div>
    <div class='criciq-sub'>IPL Intelligence Platform · 1,175 matches · 279,586 deliveries · 2008–2026</div>
</div>
""", unsafe_allow_html=True)

# ── Load data & model ────────────────────────────────────────
@st.cache_resource
def load_all():
    # Try new 55-feature model first, fallback to original
    try:
        model        = joblib.load('xgb_model_55.pkl')
        feature_cols = joblib.load('feature_cols_55.pkl')
        meta         = joblib.load('model_meta_55.pkl')
        model_label  = f"XGBoost + LightGBM Ensemble · {len(feature_cols)} features"
        lgb_model    = joblib.load('lgb_model_55.pkl') if meta.get('use_ensemble') else None
        threshold    = meta.get('best_threshold', 0.5)
    except:
        model        = joblib.load('xgb_match_predictor.pkl')
        feature_cols = ['toss_bat_first','toss_winner_is_team1','avg_1st_innings',
                        'bat_first_win_pct','pitch_dna_enc','team1_form5','team2_form5',
                        'team1_form10','team2_form10','team1_h2h_winrate','season_year']
        lgb_model    = None
        threshold    = 0.5
        model_label  = "XGBoost · 11 features"

    venue_f  = pd.read_csv('venue_features.csv')
    bat_f    = pd.read_csv('player_batting_features.csv')
    bowl_f   = pd.read_csv('player_bowling_features.csv')
    matchup  = pd.read_csv('matchup_matrix.csv')
    matches  = pd.read_csv('matches.csv')

    # Auction Intelligence data
    try:
        auc_bat  = pd.read_csv('auction_batter_profiles.csv')
        auc_bowl = pd.read_csv('auction_bowler_profiles.csv')
        auc_trends = pd.read_csv('auction_season_trends.csv')
    except:
        auc_bat = pd.DataFrame()
        auc_bowl = pd.DataFrame()
        auc_trends = pd.DataFrame()

    # Detect actual column names
    bat_sr        = 'bat_strike_rate'        if 'bat_strike_rate'        in bat_f.columns else 'sr'
    bat_avg       = 'bat_average'            if 'bat_average'            in bat_f.columns else 'avg'
    bat_pp_sr     = 'bat_powerplay_strike_rate' if 'bat_powerplay_strike_rate' in bat_f.columns else 'sr_powerplay'
    bat_mid_sr    = 'bat_middle_strike_rate' if 'bat_middle_strike_rate'  in bat_f.columns else 'sr_middle'
    bat_death_sr  = 'bat_death_strike_rate'  if 'bat_death_strike_rate'  in bat_f.columns else 'sr_death'
    bat_runs      = 'bat_runs'               if 'bat_runs'               in bat_f.columns else 'runs'
    bat_balls     = 'bat_balls'              if 'bat_balls'               in bat_f.columns else 'balls'
    bat_innings   = 'bat_innings'            if 'bat_innings'             in bat_f.columns else 'innings'
    bat_boundary  = 'bat_boundary_pct'       if 'bat_boundary_pct'        in bat_f.columns else 'boundary_pct'
    bat_dot       = 'bat_dot_pct'            if 'bat_dot_pct'             in bat_f.columns else 'dot_pct'

    bowl_econ     = 'bowl_economy'           if 'bowl_economy'           in bowl_f.columns else 'economy'
    bowl_wkts     = 'bowl_wickets'           if 'bowl_wickets'           in bowl_f.columns else 'wickets'
    bowl_pp_econ  = 'bowl_powerplay_economy' if 'bowl_powerplay_economy' in bowl_f.columns else 'economy_powerplay'
    bowl_mid_econ = 'bowl_middle_economy'    if 'bowl_middle_economy'    in bowl_f.columns else 'economy_middle'
    bowl_d_econ   = 'bowl_death_economy'     if 'bowl_death_economy'     in bowl_f.columns else 'economy_death'
    bowl_dot      = 'bowl_dot_pct'           if 'bowl_dot_pct'           in bowl_f.columns else 'dot_pct'
    bowl_sr       = 'bowl_bowling_sr'        if 'bowl_bowling_sr'        in bowl_f.columns else 'bowling_sr'
    bowl_balls    = 'bowl_balls'             if 'bowl_balls'             in bowl_f.columns else 'balls'

    col_map = {
        'bat_sr':bat_sr,'bat_avg':bat_avg,'bat_pp_sr':bat_pp_sr,
        'bat_mid_sr':bat_mid_sr,'bat_death_sr':bat_death_sr,
        'bat_runs':bat_runs,'bat_balls':bat_balls,'bat_innings':bat_innings,
        'bat_boundary':bat_boundary,'bat_dot':bat_dot,
        'bowl_econ':bowl_econ,'bowl_wkts':bowl_wkts,
        'bowl_pp_econ':bowl_pp_econ,'bowl_mid_econ':bowl_mid_econ,
        'bowl_d_econ':bowl_d_econ,'bowl_dot':bowl_dot,
        'bowl_sr':bowl_sr,'bowl_balls':bowl_balls,
    }

    return (model, lgb_model, feature_cols, threshold, model_label,
            venue_f, bat_f, bowl_f, matchup, matches, col_map,
            auc_bat, auc_bowl, auc_trends)

(model, lgb_model, feature_cols, threshold, model_label,
 venue_f, bat_f, bowl_f, matchup, matches, COL,
 auc_bat, auc_bowl, auc_trends) = load_all()

# ── Constants ────────────────────────────────────────────────
CURRENT_TEAMS = [
    'Chennai Super Kings', 'Delhi Capitals', 'Gujarat Titans',
    'Kolkata Knight Riders', 'Lucknow Super Giants', 'Mumbai Indians',
    'Punjab Kings', 'Rajasthan Royals', 'Royal Challengers Bengaluru',
    'Sunrisers Hyderabad',
]
TEAM_SHORT = {
    'Chennai Super Kings':'CSK','Delhi Capitals':'DC','Gujarat Titans':'GT',
    'Kolkata Knight Riders':'KKR','Lucknow Super Giants':'LSG','Mumbai Indians':'MI',
    'Punjab Kings':'PBKS','Rajasthan Royals':'RR','Royal Challengers Bengaluru':'RCB',
    'Sunrisers Hyderabad':'SRH',
}
TEAM_COLORS = {
    'Mumbai Indians':'#004BA0','Chennai Super Kings':'#F9CD05',
    'Royal Challengers Bengaluru':'#EC1C24','Kolkata Knight Riders':'#3A225D',
    'Sunrisers Hyderabad':'#F7A721','Delhi Capitals':'#0078BC',
    'Rajasthan Royals':'#EA1A85','Punjab Kings':'#ED1B24',
    'Gujarat Titans':'#1C1C5E','Lucknow Super Giants':'#A72056',
}
MAIN_VENUES = [
    'Wankhede Stadium','MA Chidambaram Stadium','Eden Gardens',
    'M Chinnaswamy Stadium','Arun Jaitley Stadium',
    'Rajiv Gandhi International Stadium',
    'Punjab Cricket Association IS Bindra Stadium',
    'Sawai Mansingh Stadium','Narendra Modi Stadium, Ahmedabad',
    'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
    'Maharashtra Cricket Association Stadium',
    'Himachal Pradesh Cricket Association Stadium',
]
SHAP_LABELS = {
    'toss_bat_first':'Toss: chose to bat first',
    'toss_winner_is_team1':'Toss won by team 1',
    'avg_1st_innings':'Venue avg 1st innings score',
    'bat_first_win_pct':'Bat first win % at venue',
    'pitch_dna_enc':'Pitch type (batting/bowling)',
    'team1_form5':'Team 1 — last 5 match form',
    'team2_form5':'Team 2 — last 5 match form',
    'team1_form10':'Team 1 — last 10 match form',
    'team2_form10':'Team 2 — last 10 match form',
    'team1_h2h_winrate':'Head-to-head win rate',
    'season_year':'Season year',
    't1_xi_bat_sr':'Team 1 XI batting SR',
    't2_xi_bat_sr':'Team 2 XI batting SR',
    't1_xi_death_econ':'Team 1 death bowling economy',
    't2_xi_death_econ':'Team 2 death bowling economy',
    't1_matchup_adv':'Team 1 bowling matchup advantage',
    't2_matchup_adv':'Team 2 bowling matchup advantage',
    't1_player_form':'Team 1 player recent form',
    't2_player_form':'Team 2 player recent form',
    'dew_factor':'Dew factor at venue',
    't1_home':'Team 1 home advantage',
    't2_home':'Team 2 home advantage',
    'points_diff':'Points table gap',
    't1_win_streak':'Team 1 win streak',
    't2_win_streak':'Team 2 win streak',
    'diff_xi_bat_sr':'Batting SR differential (T1 vs T2)',
    'diff_xi_bowl_econ':'Bowling economy differential',
    'diff_player_form':'Player form differential',
    'diff_win_streak':'Win streak differential',
}

# ── Helpers ──────────────────────────────────────────────────
def get_team_form(team, n=5):
    m = matches[~matches['no_result']].copy().sort_values('date')
    tm = m[(m['team1']==team)|(m['team2']==team)].tail(n)
    if len(tm)==0: return 0.5
    return (tm['winner']==team).sum()/len(tm)

def get_h2h(team1, team2, venue):
    m = matches[~matches['no_result']].copy()
    h2h = m[((m['team1']==team1)&(m['team2']==team2))|
             ((m['team1']==team2)&(m['team2']==team1))]
    h2h_v = h2h[h2h['venue'].str.contains(venue.split(',')[0],case=False,na=False)]
    use = h2h_v if len(h2h_v)>=3 else h2h
    if len(use)==0: return 0.5
    return (use['winner']==team1).sum()/len(use)

def get_venue_row(venue):
    row = venue_f[venue_f['venue'].str.contains(venue.split(',')[0],case=False,na=False)]
    if row.empty: return {'avg_1st_innings':165.0,'bat_first_win_pct':0.5,'pitch_dna':'balanced'}
    return row.iloc[0].to_dict()

def safe_col(df, col, default=0):
    return df[col] if col in df.columns else default

def predict(team1, team2, venue, toss_winner, toss_decision):
    vrow = get_venue_row(venue)
    pitch_map = {'batting_friendly':2,'balanced':1,'bowling_friendly':0}
    t1f5  = get_team_form(team1,5); t2f5  = get_team_form(team2,5)
    t1f10 = get_team_form(team1,10); t2f10 = get_team_form(team2,10)
    h2h   = get_h2h(team1,team2,venue)

    base = {
        'toss_bat_first':       1 if toss_decision=='bat' else 0,
        'toss_winner_is_team1': 1 if toss_winner==team1 else 0,
        'avg_1st_innings':      vrow['avg_1st_innings'],
        'bat_first_win_pct':    vrow['bat_first_win_pct'],
        'pitch_dna_enc':        pitch_map.get(vrow['pitch_dna'],1),
        'team1_form5':          t1f5, 'team2_form5': t2f5,
        'team1_form10':         t1f10,'team2_form10':t2f10,
        'team1_h2h_winrate':    h2h,  'season_year': 2025,
    }
    # Fill all other features with median (0 for unknowns)
    row_dict = {f: base.get(f, 0) for f in feature_cols}
    features = pd.DataFrame([row_dict])

    if lgb_model:
        prob = (model.predict_proba(features)[0]*0.5 +
                lgb_model.predict_proba(features)[0]*0.5)
    else:
        prob = model.predict_proba(features)[0]

    try:
        import shap
        explainer = shap.TreeExplainer(model)
        sv = explainer.shap_values(features)
        shap_vals = sv[0] if isinstance(sv, list) else sv[0]
        shap_info = sorted(zip(feature_cols, shap_vals), key=lambda x: abs(x[1]), reverse=True)
    except:
        shap_info = []

    ctx = {
        't1_form5':t1f5,'t2_form5':t2f5,'t1_form10':t1f10,'t2_form10':t2f10,
        'h2h_rate':h2h,'avg_score':vrow['avg_1st_innings'],
        'pitch_dna':vrow['pitch_dna'],'bat_win_pct':vrow['bat_first_win_pct'],
    }
    return prob, shap_info, ctx

def dark_fig(w=10, h=4):
    fig, ax = plt.subplots(figsize=(w,h))
    fig.patch.set_facecolor('#111E35')
    ax.set_facecolor('#111E35')
    ax.tick_params(colors='#8899BB')
    for sp in ax.spines.values(): sp.set_color('#1E3A5F')
    return fig, ax

def dark_figs(rows, cols, w=14, h=4):
    fig, axes = plt.subplots(rows, cols, figsize=(w,h))
    fig.patch.set_facecolor('#111E35')
    axlist = axes.flatten() if hasattr(axes,'flatten') else [axes]
    for ax in axlist:
        ax.set_facecolor('#111E35')
        ax.tick_params(colors='#8899BB')
        for sp in ax.spines.values(): sp.set_color('#1E3A5F')
    return fig, axes

# ── TABS ─────────────────────────────────────────────────────
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "🎯 Match Predictor",
    "📊 Team Analysis",
    "👤 Player Scout",
    "⚔️ Matchup Explorer",
    "🏟️ Venue Intel",
    "🏆 Auction Intelligence",
])

# ════════════════════════════════════════════════════════════
# TAB 1 — MATCH PREDICTOR
# ════════════════════════════════════════════════════════════
with tab1:
    st.markdown("<div class='section-title'>Select match details</div>", unsafe_allow_html=True)

    c1, c2, c3 = st.columns(3)
    with c1:
        team1 = st.selectbox("🔵 Team 1", CURRENT_TEAMS, index=5)
    with c2:
        remaining = [t for t in CURRENT_TEAMS if t!=team1]
        team2 = st.selectbox("🔴 Team 2", remaining, index=0)
    with c3:
        venue = st.selectbox("🏟️ Venue", MAIN_VENUES)

    c4, c5 = st.columns(2)
    with c4: toss_winner   = st.selectbox("🪙 Toss won by", [team1, team2])
    with c5: toss_decision = st.selectbox("📋 Elected to", ["bat","field"])

    st.markdown("")
    predict_btn = st.button("🔮 Predict Winner", type="primary", use_container_width=True)

    if predict_btn:
        with st.spinner("Analysing 17 seasons of IPL data..."):
            prob, shap_info, ctx = predict(team1, team2, venue, toss_winner, toss_decision)

        p1 = prob[1]*100; p2 = prob[0]*100
        winner = team1 if p1>p2 else team2
        conf   = max(p1,p2)
        c1col  = TEAM_COLORS.get(team1,'#1B4FD8')
        c2col  = TEAM_COLORS.get(team2,'#FF6B00')
        wcol   = c1col if winner==team1 else c2col

        # Winner banner
        st.markdown(f"""
        <div class='winner-banner' style='background:{wcol}18;border:2px solid {wcol}88'>
            <div class='winner-label'>⚡ Predicted Winner</div>
            <div class='winner-name' style='color:{wcol}'>{winner}</div>
            <div class='winner-conf'>{conf:.1f}% confidence · Model: {model_label}</div>
        </div>
        """, unsafe_allow_html=True)

        # Probability display
        st.markdown("<div class='section-title'>Win Probability</div>", unsafe_allow_html=True)
        ca, cb = st.columns(2)
        with ca:
            st.markdown(f"""
            <div class='card' style='border-color:{c1col}66;text-align:center'>
                <div style='font-size:13px;color:#8899BB;letter-spacing:2px'>{TEAM_SHORT.get(team1,team1)}</div>
                <div style='font-size:48px;font-weight:800;color:{c1col}'>{p1:.1f}%</div>
                <div style='color:#8899BB;font-size:13px'>{team1}</div>
            </div>""", unsafe_allow_html=True)
        with cb:
            st.markdown(f"""
            <div class='card' style='border-color:{c2col}66;text-align:center'>
                <div style='font-size:13px;color:#8899BB;letter-spacing:2px'>{TEAM_SHORT.get(team2,team2)}</div>
                <div style='font-size:48px;font-weight:800;color:{c2col}'>{p2:.1f}%</div>
                <div style='color:#8899BB;font-size:13px'>{team2}</div>
            </div>""", unsafe_allow_html=True)

        # Probability bar
        fig, ax = dark_fig(10, 1.1)
        ax.barh([0],[p1], color=c1col, height=0.55)
        ax.barh([0],[p2], left=[p1], color=c2col, height=0.55)
        ax.set_xlim(0,100); ax.axis('off')
        ax.text(p1/2, 0, f'{p1:.0f}%', ha='center', va='center',
                fontsize=14, fontweight='bold', color='white')
        ax.text(p1+p2/2, 0, f'{p2:.0f}%', ha='center', va='center',
                fontsize=14, fontweight='bold', color='white')
        plt.tight_layout(pad=0)
        st.pyplot(fig, use_container_width=True); plt.close()

        # Insight cards
        st.markdown("<div class='section-title'>Match Context</div>", unsafe_allow_html=True)
        i1,i2,i3,i4 = st.columns(4)
        pitch_icon = {'batting_friendly':'🏏 Batting','balanced':'⚖️ Balanced','bowling_friendly':'🎳 Bowling'}
        with i1: st.metric("Pitch Type", pitch_icon.get(ctx['pitch_dna'],'Balanced'))
        with i2: st.metric("Avg 1st Innings", f"{ctx['avg_score']:.0f} runs")
        with i3: st.metric("Bat 1st wins here", f"{ctx['bat_win_pct']*100:.0f}%")
        with i4: st.metric(f"H2H ({TEAM_SHORT.get(team1,'T1')} win rate)", f"{ctx['h2h_rate']*100:.0f}%")

        f1,f2,f3,f4 = st.columns(4)
        with f1: st.metric(f"{TEAM_SHORT.get(team1,'T1')} — last 5",  f"{ctx['t1_form5']*100:.0f}%", delta=f"{'▲' if ctx['t1_form5']>0.5 else '▼'} form")
        with f2: st.metric(f"{TEAM_SHORT.get(team2,'T2')} — last 5",  f"{ctx['t2_form5']*100:.0f}%", delta=f"{'▲' if ctx['t2_form5']>0.5 else '▼'} form")
        with f3: st.metric(f"{TEAM_SHORT.get(team1,'T1')} — last 10", f"{ctx['t1_form10']*100:.0f}%")
        with f4: st.metric(f"{TEAM_SHORT.get(team2,'T2')} — last 10", f"{ctx['t2_form10']*100:.0f}%")

        # SHAP chart
        if shap_info:
            st.markdown("<div class='section-title'>Why this prediction? — Feature Impact (SHAP)</div>", unsafe_allow_html=True)
            st.caption(f"🟠 Orange = favours {team1}  ·  🔵 Blue = favours {team2}")
            top = shap_info[:10]
            labels = [SHAP_LABELS.get(f,f) for f,_ in top]
            values = [v for _,v in top]
            colors = [c1col if v>0 else c2col for v in values]
            fig2, ax2 = dark_fig(10,5)
            ax2.barh(range(len(values)), values, color=colors, height=0.6)
            ax2.set_yticks(range(len(labels)))
            ax2.set_yticklabels(labels, color='white', fontsize=11)
            ax2.axvline(0, color='#8899BB', linewidth=0.8, alpha=0.6)
            ax2.set_xlabel('SHAP impact on prediction', color='#8899BB')
            p1p = mpatches.Patch(color=c1col, label=f'Favours {team1}')
            p2p = mpatches.Patch(color=c2col, label=f'Favours {team2}')
            ax2.legend(handles=[p1p,p2p], facecolor='#111E35', labelcolor='white', fontsize=10)
            ax2.spines['top'].set_visible(False); ax2.spines['right'].set_visible(False)
            plt.tight_layout()
            st.pyplot(fig2, use_container_width=True); plt.close()

# ════════════════════════════════════════════════════════════
# TAB 2 — TEAM ANALYSIS
# ════════════════════════════════════════════════════════════
with tab2:
    st.markdown("<div class='section-title'>Team Head-to-Head & Season Performance</div>", unsafe_allow_html=True)

    tc1, tc2 = st.columns(2)
    with tc1: t_a = st.selectbox("Team A", CURRENT_TEAMS, index=5, key='ta')
    with tc2: t_b = st.selectbox("Team B", [t for t in CURRENT_TEAMS if t!=t_a], index=0, key='tb')

    m_all = matches[~matches['no_result']].copy()
    h2h_df = m_all[
        ((m_all['team1']==t_a)&(m_all['team2']==t_b))|
        ((m_all['team1']==t_b)&(m_all['team2']==t_a))
    ].sort_values('date', ascending=False)

    # H2H summary
    total   = len(h2h_df)
    ta_wins = (h2h_df['winner']==t_a).sum()
    tb_wins = (h2h_df['winner']==t_b).sum()

    ca, cb, cc = st.columns(3)
    with ca: st.metric(f"{TEAM_SHORT.get(t_a,'A')} wins", ta_wins)
    with cb: st.metric("Total matches", total)
    with cc: st.metric(f"{TEAM_SHORT.get(t_b,'B')} wins", tb_wins)

    if total > 0:
        # H2H pie
        fig, ax = dark_fig(6, 3)
        vals = [ta_wins, tb_wins]
        lbls = [TEAM_SHORT.get(t_a,t_a), TEAM_SHORT.get(t_b,t_b)]
        cols = [TEAM_COLORS.get(t_a,'#1B4FD8'), TEAM_COLORS.get(t_b,'#FF6B00')]
        ax.pie(vals, labels=lbls, colors=cols, autopct='%1.0f%%',
               textprops={'color':'white','fontsize':13,'fontweight':'bold'},
               wedgeprops={'linewidth':2,'edgecolor':'#0A1628'})
        ax.set_title(f'{t_a} vs {t_b} — All time H2H', color='white', fontsize=13, fontweight='bold')
        st.pyplot(fig, use_container_width=True); plt.close()

        # Recent results
        st.markdown("<div class='section-title'>Recent Results</div>", unsafe_allow_html=True)
        for _, row in h2h_df.head(10).iterrows():
            won_by_a = row['winner'] == t_a
            css_cls  = 'h2h-win' if won_by_a else 'h2h-loss'
            win_team = TEAM_SHORT.get(row['winner'], row['winner'])
            margin   = f"{int(row['win_by_runs'])} runs" if row['win_by_runs']>0 else f"{int(row['win_by_wickets'])} wkts"
            st.markdown(f"""
            <div class='h2h-row {css_cls}'>
                <span>{row['date']} · {str(row.get('venue',''))[:30]}</span>
                <span style='font-weight:600'>🏆 {win_team} won by {margin}</span>
                <span style='color:#8899BB'>{row.get('season','')}</span>
            </div>""", unsafe_allow_html=True)

    # Season win % chart
    st.markdown("<div class='section-title'>Season-wise Win Rate</div>", unsafe_allow_html=True)
    season_map2 = {'2007/08':2008,'2009':2009,'2009/10':2010,'2011':2011,'2012':2012,
        '2013':2013,'2014':2014,'2015':2015,'2016':2016,'2017':2017,'2018':2018,
        '2019':2019,'2020/21':2020,'2021':2021,'2022':2022,'2023':2023,'2024':2024,'2025':2025}
    m_all2 = m_all.copy()
    m_all2['season_year'] = m_all2['season'].map(season_map2).fillna(2020)

    def season_winrate(team):
        rows=[]
        for sy in sorted(m_all2['season_year'].unique()):
            tm = m_all2[(m_all2['season_year']==sy)&
                        ((m_all2['team1']==team)|(m_all2['team2']==team))]
            if len(tm)>=4:
                rows.append({'season':sy,'win_pct':(tm['winner']==team).sum()/len(tm)*100})
        return pd.DataFrame(rows)

    df_a = season_winrate(t_a); df_b = season_winrate(t_b)

    if len(df_a)>0 or len(df_b)>0:
        fig, ax = dark_fig(12,4)
        if len(df_a)>0:
            ax.plot(df_a['season'], df_a['win_pct'], 'o-',
                    color=TEAM_COLORS.get(t_a,'#1B4FD8'), linewidth=2.5,
                    markersize=7, label=t_a)
        if len(df_b)>0:
            ax.plot(df_b['season'], df_b['win_pct'], 's-',
                    color=TEAM_COLORS.get(t_b,'#FF6B00'), linewidth=2.5,
                    markersize=7, label=t_b)
        ax.axhline(50, color='#3A5070', linestyle='--', linewidth=1)
        ax.set_ylabel('Win %', color='#8899BB')
        ax.set_xlabel('Season', color='#8899BB')
        ax.set_title('Season-wise win rate', color='white', fontsize=13, fontweight='bold')
        ax.legend(facecolor='#111E35', labelcolor='white')
        ax.set_ylim(0,100)
        plt.tight_layout()
        st.pyplot(fig, use_container_width=True); plt.close()

# ════════════════════════════════════════════════════════════
# TAB 3 — PLAYER SCOUT
# ════════════════════════════════════════════════════════════
with tab3:
    st.markdown("<div class='section-title'>Player Intelligence</div>", unsafe_allow_html=True)

    all_batters = sorted(bat_f['batter'].unique().tolist())
    all_bowlers = sorted(bowl_f['bowler'].unique().tolist())

    pc1, pc2 = st.columns(2)
    with pc1:
        sel_bat = st.selectbox("🏏 Batter", all_batters,
                                index=all_batters.index('V Kohli') if 'V Kohli' in all_batters else 0)
    with pc2:
        sel_bowl = st.selectbox("🎳 Bowler", all_bowlers,
                                 index=all_bowlers.index('JJ Bumrah') if 'JJ Bumrah' in all_bowlers else 0)

    bc1, bc2 = st.columns(2)

    # Batter
    with bc1:
        bs = bat_f[bat_f['batter']==sel_bat]
        if not bs.empty:
            bs = bs.iloc[0]
            st.markdown(f"<div class='section-title'>{sel_bat}</div>", unsafe_allow_html=True)
            runs  = int(bs.get(COL['bat_runs'],0) or 0)
            balls = int(bs.get(COL['bat_balls'],1) or 1)
            sr    = float(bs.get(COL['bat_sr'],0) or 0)
            avg   = float(bs.get(COL['bat_avg'],0) or 0)
            inn   = int(bs.get(COL['bat_innings'],0) or 0)
            bdry  = float(bs.get(COL['bat_boundary'],0) or 0)
            dot   = float(bs.get(COL['bat_dot'],0) or 0)

            m1,m2,m3 = st.columns(3)
            m1.metric("IPL Runs",    f"{runs:,}")
            m2.metric("Strike Rate", f"{sr:.1f}")
            m3.metric("Average",     f"{avg:.1f}")

            m4,m5,m6 = st.columns(3)
            m4.metric("Innings",      f"{inn}")
            m5.metric("Boundary %",   f"{bdry:.1f}%")
            m6.metric("Dot ball %",   f"{dot:.1f}%")

            # Phase SR chart
            phases = ['Powerplay','Middle','Death']
            srs = [
                float(bs.get(COL['bat_pp_sr'],0) or 0),
                float(bs.get(COL['bat_mid_sr'],0) or 0),
                float(bs.get(COL['bat_death_sr'],0) or 0),
            ]
            fig, ax = dark_fig(5,3)
            bars = ax.bar(phases, srs, color=['#FF6B00','#1B4FD8','#EC1C24'], width=0.5)
            for bar, val in zip(bars,srs):
                if val>0: ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+2,
                                  f'{val:.0f}', ha='center', color='white', fontsize=11, fontweight='bold')
            ax.set_ylabel('Strike Rate', color='#8899BB')
            ax.set_title(f'{sel_bat} — SR by Phase', color='white', fontsize=12, fontweight='bold')
            plt.tight_layout()
            st.pyplot(fig, use_container_width=True); plt.close()

    # Bowler
    with bc2:
        bw = bowl_f[bowl_f['bowler']==sel_bowl]
        if not bw.empty:
            bw = bw.iloc[0]
            st.markdown(f"<div class='section-title'>{sel_bowl}</div>", unsafe_allow_html=True)
            wkts  = int(bw.get(COL['bowl_wkts'],0) or 0)
            econ  = float(bw.get(COL['bowl_econ'],0) or 0)
            bsr   = float(bw.get(COL['bowl_sr'],0) or 0)
            bdot  = float(bw.get(COL['bowl_dot'],0) or 0)
            bballs= int(bw.get(COL['bowl_balls'],0) or 0)

            m1,m2,m3 = st.columns(3)
            m1.metric("IPL Wickets",  f"{wkts}")
            m2.metric("Economy",      f"{econ:.2f}")
            m3.metric("Dot ball %",   f"{bdot:.1f}%")

            m4,m5,m6 = st.columns(3)
            m4.metric("Total balls",  f"{bballs:,}")
            m5.metric("Bowling SR",   f"{bsr:.1f}")
            m6.metric("Balls/wkt",    f"{bsr:.1f}")

            # Phase economy chart
            phases = ['Powerplay','Middle','Death']
            econs  = [
                float(bw.get(COL['bowl_pp_econ'],0) or 0),
                float(bw.get(COL['bowl_mid_econ'],0) or 0),
                float(bw.get(COL['bowl_d_econ'],0) or 0),
            ]
            fig, ax = dark_fig(5,3)
            bars = ax.bar(phases, econs, color=['#FF6B00','#1B4FD8','#EC1C24'], width=0.5)
            for bar, val in zip(bars,econs):
                if val>0: ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.1,
                                  f'{val:.1f}', ha='center', color='white', fontsize=11, fontweight='bold')
            ax.set_ylabel('Economy Rate', color='#8899BB')
            ax.set_title(f'{sel_bowl} — Economy by Phase', color='white', fontsize=12, fontweight='bold')
            plt.tight_layout()
            st.pyplot(fig, use_container_width=True); plt.close()

# ════════════════════════════════════════════════════════════
# TAB 4 — MATCHUP EXPLORER
# ════════════════════════════════════════════════════════════
with tab4:
    st.markdown("<div class='section-title'>Bowler vs Batter — IPL Matchup Intelligence</div>", unsafe_allow_html=True)
    st.caption("17 seasons of ball-by-ball data. Minimum 6 balls required.")

    mc1, mc2 = st.columns(2)
    with mc1: m_bowl = st.selectbox("🎳 Bowler", all_bowlers,
                                     index=all_bowlers.index('JJ Bumrah') if 'JJ Bumrah' in all_bowlers else 0, key='mb')
    with mc2: m_bat  = st.selectbox("🏏 Batter", all_batters,
                                     index=all_batters.index('V Kohli') if 'V Kohli' in all_batters else 0, key='ma')

    if st.button("⚡ Analyse Matchup", use_container_width=True):
        mx = matchup[(matchup['bowler']==m_bowl)&(matchup['batter']==m_bat)]
        if mx.empty:
            st.warning(f"Not enough data for {m_bowl} vs {m_bat} — need at least 6 balls")
        else:
            mx = mx.iloc[0]
            balls=int(mx['balls']); runs=int(mx['runs']); dismi=int(mx['dismissals'])
            sr=float(mx['strike_rate']); econ=float(mx['economy'])
            dism_pct=float(mx['dismissal_pct']); dot_pct=float(mx['dot_pct'])
            bdry_pct=float(mx['boundary_pct'])

            if dism_pct>10 or (sr<100 and dot_pct>40):
                verdict="🟢 BOWLER DOMINATES"; vcol="#00C851"
            elif sr>160 or bdry_pct>35:
                verdict="🔴 BATTER DOMINATES"; vcol="#FF3D3D"
            else:
                verdict="🟡 EVEN CONTEST"; vcol="#F9CD05"

            st.markdown(f"""
            <div style='background:{vcol}18;border:2px solid {vcol}66;border-radius:14px;
                 padding:20px;text-align:center;margin:16px 0'>
                <div style='font-size:22px;font-weight:800;color:{vcol}'>{verdict}</div>
                <div style='color:#8899BB;margin-top:6px'>{m_bowl} vs {m_bat} · {balls} balls in IPL history</div>
            </div>""", unsafe_allow_html=True)

            c1,c2,c3,c4,c5 = st.columns(5)
            c1.metric("Balls",balls); c2.metric("Runs",runs)
            c3.metric("Dismissals",dismi); c4.metric("Strike Rate",f"{sr:.1f}")
            c5.metric("Dismissal %",f"{dism_pct:.1f}%")
            c6,c7,c8 = st.columns(3)
            c6.metric("Economy",f"{econ:.2f}")
            c7.metric("Dot ball %",f"{dot_pct:.1f}%")
            c8.metric("Boundary %",f"{bdry_pct:.1f}%")

            fig, axes = dark_figs(1,2, w=10, h=3.5)
            # Pie
            dots_r = int(mx.get('dots',0)); bdry_r = int(mx.get('fours',0))+int(mx.get('sixes',0))
            singles = max(0,balls-dots_r-bdry_r)
            axes[0].pie([dots_r,singles,bdry_r],
                        labels=['Dots','Singles','Boundaries'],
                        colors=['#3A5070','#1B4FD8','#FF6B00'],
                        autopct='%1.0f%%',
                        textprops={'color':'white','fontsize':11},
                        wedgeprops={'linewidth':2,'edgecolor':'#0A1628'})
            axes[0].set_title('Ball breakdown', color='white', fontsize=11)
            # Bar
            axes[1].bar(['SR','Dot%','Dismissal%'],[sr,dot_pct,dism_pct],
                        color=['#1B4FD8','#FF6B00','#EC1C24'], width=0.5)
            axes[1].set_title('Key metrics', color='white', fontsize=11)
            axes[1].set_ylabel('Value', color='#8899BB')
            plt.tight_layout()
            st.pyplot(fig, use_container_width=True); plt.close()

# ════════════════════════════════════════════════════════════
# TAB 5 — VENUE INTEL
# ════════════════════════════════════════════════════════════
with tab5:
    st.markdown("<div class='section-title'>Venue Intelligence & Pitch DNA</div>", unsafe_allow_html=True)

    sel_venue = st.selectbox("🏟️ Select venue", MAIN_VENUES, key='vi')
    vrow = get_venue_row(sel_venue)

    v1,v2,v3,v4 = st.columns(4)
    pitch_icon = {'batting_friendly':'🏏 Batting Friendly','balanced':'⚖️ Balanced','bowling_friendly':'🎳 Bowling Friendly'}
    v1.metric("Pitch DNA",       pitch_icon.get(vrow['pitch_dna'],'Balanced'))
    v2.metric("Avg 1st innings", f"{vrow['avg_1st_innings']:.0f}")
    v3.metric("Bat first wins",  f"{vrow['bat_first_win_pct']*100:.0f}%")
    v4.metric("Chase wins",      f"{(1-vrow['bat_first_win_pct'])*100:.0f}%")

    # Top batters at this venue
    st.markdown("<div class='section-title'>Top Run Scorers at this Venue</div>", unsafe_allow_html=True)
    if 'player_venue_stats.csv' in [f for f in ['player_venue_stats.csv']]:
        try:
            pv = pd.read_csv('player_venue_stats.csv')
            vpart = sel_venue.split(',')[0]
            pv_sub = pv[pv['venue'].str.contains(vpart, case=False, na=False)]
            if not pv_sub.empty:
                top_bat_v = pv_sub.nlargest(10,'pv_runs')[['batter','pv_runs','pv_balls','pv_sr']].reset_index(drop=True)
                top_bat_v.columns = ['Player','Runs','Balls','Strike Rate']
                top_bat_v.index = top_bat_v.index+1

                fig, ax = dark_fig(10,4)
                colors_v = ['#FF6B00' if i==0 else '#1B4FD8' for i in range(len(top_bat_v))]
                ax.barh(top_bat_v['Player'][::-1], top_bat_v['Runs'][::-1], color=colors_v[::-1])
                ax.set_xlabel('Runs', color='#8899BB')
                ax.set_title(f'Top run scorers — {vpart}', color='white', fontsize=12, fontweight='bold')
                plt.tight_layout()
                st.pyplot(fig, use_container_width=True); plt.close()

                st.dataframe(top_bat_v, use_container_width=True, hide_index=False)
        except: pass

    # All venues avg score comparison
    st.markdown("<div class='section-title'>All Venues — Avg 1st Innings Score</div>", unsafe_allow_html=True)
    vf_sorted = venue_f[venue_f['matches_played']>=5].sort_values('avg_1st_innings',ascending=True)
    vf_sorted['venue_short'] = vf_sorted['venue'].apply(lambda x: x.split(',')[0][:28])

    fig, ax = dark_fig(10, max(4, len(vf_sorted)*0.35))
    colors_v = ['#FF6B00' if vf_sorted.iloc[i]['venue']==sel_venue else '#1B4FD8'
                for i in range(len(vf_sorted))]
    ax.barh(vf_sorted['venue_short'], vf_sorted['avg_1st_innings'], color=colors_v)
    ax.axvline(vf_sorted['avg_1st_innings'].mean(), color='#F9CD05',
               linestyle='--', linewidth=1.5, label='Overall avg')
    ax.set_xlabel('Avg 1st innings score', color='#8899BB')
    ax.set_title('Venue batting friendliness', color='white', fontsize=12, fontweight='bold')
    ax.legend(facecolor='#111E35', labelcolor='white')
    plt.tight_layout()
    st.pyplot(fig, use_container_width=True); plt.close()

# ════════════════════════════════════════════════════════════
# TAB 6 — AUCTION INTELLIGENCE
# ════════════════════════════════════════════════════════════
with tab6:
    if auc_bat.empty or auc_bowl.empty:
        st.warning("Auction data not found. Run `python auction_data_pipeline.py` first.")
    else:
        # ── Extra CSS for auction tab ──
        st.markdown("""
        <style>
            .scout-score-box {
                background: linear-gradient(135deg, #0A1628, #1B2B4B);
                border: 2px solid #FF6B00;
                border-radius: 16px;
                padding: 24px;
                text-align: center;
            }
            .archetype-badge {
                display: inline-block;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            .filter-result-row {
                background: #111E35;
                border: 1px solid #1E3A5F;
                border-radius: 10px;
                padding: 12px 16px;
                margin: 6px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .bid-tag {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
            }
        </style>
        """, unsafe_allow_html=True)

        # ── Auction sub-tabs ──
        auc_sub1, auc_sub2, auc_sub3, auc_sub4 = st.tabs([
            "🏏 Player Scouting",
            "🔍 Smart Filters",
            "⚔️ H2H Deep Dive",
            "💰 Auction Engine",
        ])

        # ════════════════════════════════════════════════════
        # AUCTION SUB-TAB 1: PLAYER SCOUTING PROFILE
        # ════════════════════════════════════════════════════
        with auc_sub1:
            st.markdown("<div class='section-title'>Franchise Scouting Report</div>", unsafe_allow_html=True)
            st.caption("Select any player for a full franchise-grade scouting report with 40+ metrics")

            role_choice = st.radio("Role", ["Batter", "Bowler"], horizontal=True, key='scout_role')

            ARCHETYPE_COLORS = {
                'Finisher': '#FF6B00', 'Aggressor': '#EC1C24', 'Anchor': '#1B4FD8',
                'All-Phase': '#00C851', 'Accumulator': '#F9CD05', 'Utility': '#8899BB',
                'Death Specialist': '#EC1C24', 'Powerplay Specialist': '#FF6B00',
                'Strike Bowler': '#1B4FD8', 'Defensive': '#00C851',
            }

            if role_choice == "Batter":
                all_auc_batters = sorted(auc_bat['batter'].unique().tolist())
                sel = st.selectbox("Select Batter", all_auc_batters,
                    index=all_auc_batters.index('V Kohli') if 'V Kohli' in all_auc_batters else 0,
                    key='auc_bat_sel')
                p = auc_bat[auc_bat['batter'] == sel].iloc[0]

                arch_col = ARCHETYPE_COLORS.get(p['archetype'], '#8899BB')

                # ── Hero section ──
                h1, h2 = st.columns([2, 1])
                with h1:
                    st.markdown(f"""
                    <div style='margin-bottom:12px'>
                        <span style='font-size:32px;font-weight:800;color:white'>{sel}</span>
                        <span class='archetype-badge' style='background:{arch_col}33;color:{arch_col};
                              border:1px solid {arch_col};margin-left:12px'>{p['archetype']}</span>
                    </div>
                    <div style='color:#8899BB;font-size:13px'>
                        Career: {int(p['first_season'])}–{int(p['last_season'])} · {int(p['career_span'])} seasons ·
                        Trend: <span style='color:{"#00C851" if p["season_trend"]=="improving" else "#FF3D3D" if p["season_trend"]=="declining" else "#F9CD05"}'>
                        {"📈 Improving" if p["season_trend"]=="improving" else "📉 Declining" if p["season_trend"]=="declining" else "➡️ Stable"}</span>
                    </div>
                    """, unsafe_allow_html=True)
                with h2:
                    score = p['scouting_score']
                    score_col = '#00C851' if score >= 70 else '#FF6B00' if score >= 50 else '#FF3D3D'
                    st.markdown(f"""
                    <div class='scout-score-box'>
                        <div style='font-size:11px;color:#8899BB;letter-spacing:2px'>SCOUTING SCORE</div>
                        <div style='font-size:52px;font-weight:800;color:{score_col}'>{score}</div>
                        <div style='font-size:12px;color:#8899BB'>out of 100</div>
                    </div>
                    """, unsafe_allow_html=True)

                st.markdown("---")

                # ── Core stats row ──
                c1,c2,c3,c4,c5,c6 = st.columns(6)
                c1.metric("Runs", f"{int(p['total_runs']):,}")
                c2.metric("Innings", int(p['total_innings']))
                c3.metric("Average", f"{p['overall_avg']:.1f}")
                c4.metric("Strike Rate", f"{p['overall_sr']:.1f}")
                c5.metric("Boundary %", f"{p['boundary_pct']:.1f}%")
                c6.metric("Dot %", f"{p['dot_pct']:.1f}%")

                # ── Phase SR + Spin vs Pace ──
                col_left, col_right = st.columns(2)
                with col_left:
                    st.markdown("<div class='section-title'>Phase Performance</div>", unsafe_allow_html=True)
                    fig, ax = dark_fig(6, 3.5)
                    phases = ['Powerplay', 'Middle', 'Death']
                    srs = [p['pp_sr'], p['mid_sr'], p['death_sr']]
                    bars = ax.bar(phases, srs, color=['#FF6B00', '#1B4FD8', '#EC1C24'], width=0.55,
                                  edgecolor='#0A1628', linewidth=1.5)
                    for bar, val in zip(bars, srs):
                        if val > 0:
                            ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+2,
                                    f'{val:.0f}', ha='center', color='white', fontsize=12, fontweight='bold')
                    ax.axhline(130, color='#3A5070', linestyle='--', linewidth=1, alpha=0.5)
                    ax.set_ylabel('Strike Rate', color='#8899BB')
                    ax.set_title(f'SR by Phase', color='white', fontsize=12, fontweight='bold')
                    plt.tight_layout()
                    st.pyplot(fig, use_container_width=True); plt.close()

                with col_right:
                    st.markdown("<div class='section-title'>vs Spin & Pace</div>", unsafe_allow_html=True)
                    fig, ax = dark_fig(6, 3.5)
                    types = ['vs Spin', 'vs Pace']
                    vals = [p['sr_vs_spin'], p['sr_vs_pace']]
                    bars = ax.bar(types, vals, color=['#A855F7', '#3B82F6'], width=0.45,
                                  edgecolor='#0A1628', linewidth=1.5)
                    for bar, val in zip(bars, vals):
                        if val > 0:
                            ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+2,
                                    f'{val:.0f}', ha='center', color='white', fontsize=12, fontweight='bold')
                    ax.axhline(130, color='#3A5070', linestyle='--', linewidth=1, alpha=0.5)
                    ax.set_ylabel('Strike Rate', color='#8899BB')
                    ax.set_title('SR vs Bowler Type', color='white', fontsize=12, fontweight='bold')
                    plt.tight_layout()
                    st.pyplot(fig, use_container_width=True); plt.close()

                # ── Advanced Metrics Grid ──
                st.markdown("<div class='section-title'>Advanced Metrics</div>", unsafe_allow_html=True)
                a1,a2,a3,a4 = st.columns(4)
                a1.metric("Intent Score", f"{p['intent_score']:.0f}",
                          help="SR in first 10 balls of each innings")
                a2.metric("Acceleration", f"{p['acceleration_index']:.2f}x",
                          help="Death SR / PP SR ratio")
                a3.metric("Pressure SR", f"{p['pressure_sr']:.0f}",
                          help="SR in overs 15-20 while chasing")
                a4.metric("Consistency", f"{p['consistency']:.2f}",
                          help="1 = perfectly consistent, 0 = highly variable")

                # ── Chase vs Defend ──
                st.markdown("<div class='section-title'>Chase vs Defend</div>", unsafe_allow_html=True)
                cd1, cd2 = st.columns(2)
                with cd1:
                    st.markdown(f"""
                    <div class='card-blue' style='text-align:center'>
                        <div style='font-size:12px;color:#8899BB;letter-spacing:2px'>CHASING</div>
                        <div style='font-size:28px;font-weight:800;color:#1B4FD8'>SR {p['chase_sr']:.0f} · Avg {p['chase_avg']:.0f}</div>
                        <div style='color:#8899BB;font-size:12px'>Win rate: {p['chase_win_pct']:.0f}%</div>
                    </div>""", unsafe_allow_html=True)
                with cd2:
                    st.markdown(f"""
                    <div class='card-orange' style='text-align:center'>
                        <div style='font-size:12px;color:#8899BB;letter-spacing:2px'>DEFENDING</div>
                        <div style='font-size:28px;font-weight:800;color:#FF6B00'>SR {p['defend_sr']:.0f} · Avg {p['defend_avg']:.0f}</div>
                    </div>""", unsafe_allow_html=True)

                # ── Dismissal Pattern ──
                col_dism, col_trend = st.columns(2)
                with col_dism:
                    st.markdown("<div class='section-title'>Dismissal Pattern</div>", unsafe_allow_html=True)
                    fig, ax = dark_fig(6, 3)
                    dism_types = ['Caught', 'Bowled', 'LBW', 'Stumped', 'Run Out']
                    dism_vals = [p['caught_pct'], p['bowled_pct'], p['lbw_pct'], p['stumped_pct'], p['runout_pct']]
                    dism_colors = ['#FF6B00', '#1B4FD8', '#EC1C24', '#A855F7', '#3A5070']
                    ax.barh(dism_types, dism_vals, color=dism_colors, height=0.5)
                    for i, val in enumerate(dism_vals):
                        if val > 0:
                            ax.text(val+1, i, f'{val:.0f}%', va='center', color='white', fontsize=10)
                    ax.set_xlabel('% of dismissals', color='#8899BB')
                    ax.set_title('How they get out', color='white', fontsize=12, fontweight='bold')
                    plt.tight_layout()
                    st.pyplot(fig, use_container_width=True); plt.close()

                # ── Season Trajectory ──
                with col_trend:
                    st.markdown("<div class='section-title'>Season Trajectory</div>", unsafe_allow_html=True)
                    player_trends = auc_trends[(auc_trends['player'] == sel) & (auc_trends['role'] == 'batter')]
                    if not player_trends.empty and len(player_trends) >= 2:
                        player_trends = player_trends.sort_values('season_year')
                        fig, ax = dark_fig(6, 3)
                        ax.plot(player_trends['season_year'], player_trends['sr'], 'o-',
                                color='#FF6B00', linewidth=2.5, markersize=6, label='SR')
                        ax2 = ax.twinx()
                        ax2.plot(player_trends['season_year'], player_trends['avg'], 's--',
                                 color='#1B4FD8', linewidth=2, markersize=5, label='Avg')
                        ax2.set_facecolor('#111E35')
                        ax2.tick_params(colors='#8899BB')
                        ax2.set_ylabel('Average', color='#1B4FD8')
                        ax.set_ylabel('Strike Rate', color='#FF6B00')
                        ax.set_title('Season-wise Trend', color='white', fontsize=12, fontweight='bold')
                        lines1, labels1 = ax.get_legend_handles_labels()
                        lines2, labels2 = ax2.get_legend_handles_labels()
                        ax.legend(lines1+lines2, labels1+labels2, facecolor='#111E35', labelcolor='white', fontsize=9)
                        plt.tight_layout()
                        st.pyplot(fig, use_container_width=True); plt.close()
                    else:
                        st.info("Insufficient season data for trajectory chart")

                # ── Last 10 Innings ──
                st.markdown("<div class='section-title'>Recent Form — Last 10 Innings</div>", unsafe_allow_html=True)
                try:
                    scores = eval(p['last10_scores'])
                    fig, ax = dark_fig(10, 2.5)
                    colors_l10 = ['#00C851' if s >= 30 else '#FF6B00' if s >= 15 else '#3A5070' for s in scores]
                    bars = ax.bar(range(1, len(scores)+1), scores, color=colors_l10, width=0.6,
                                  edgecolor='#0A1628', linewidth=1)
                    for bar, val in zip(bars, scores):
                        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+1,
                                str(int(val)), ha='center', color='white', fontsize=10)
                    ax.axhline(p['overall_avg'], color='#F9CD05', linestyle='--', linewidth=1, label=f"Career avg: {p['overall_avg']:.0f}")
                    ax.set_xlabel('Innings (most recent →)', color='#8899BB')
                    ax.set_ylabel('Runs', color='#8899BB')
                    ax.legend(facecolor='#111E35', labelcolor='white', fontsize=9)
                    plt.tight_layout()
                    st.pyplot(fig, use_container_width=True); plt.close()
                except:
                    pass

            # ── BOWLER SCOUTING ──
            else:
                all_auc_bowlers = sorted(auc_bowl['bowler'].unique().tolist())
                sel_b = st.selectbox("Select Bowler", all_auc_bowlers,
                    index=all_auc_bowlers.index('JJ Bumrah') if 'JJ Bumrah' in all_auc_bowlers else 0,
                    key='auc_bowl_sel')
                bp = auc_bowl[auc_bowl['bowler'] == sel_b].iloc[0]

                arch_col = ARCHETYPE_COLORS.get(bp['archetype'], '#8899BB')

                # ── Hero section ──
                h1, h2 = st.columns([2, 1])
                with h1:
                    st.markdown(f"""
                    <div style='margin-bottom:12px'>
                        <span style='font-size:32px;font-weight:800;color:white'>{sel_b}</span>
                        <span class='archetype-badge' style='background:{arch_col}33;color:{arch_col};
                              border:1px solid {arch_col};margin-left:12px'>{bp['archetype']}</span>
                        <span class='archetype-badge' style='background:#1E3A5F;color:#8899BB;
                              border:1px solid #3A5070;margin-left:8px'>{bp['bowler_type'].upper()}</span>
                    </div>
                    <div style='color:#8899BB;font-size:13px'>
                        Career: {int(bp['first_season'])}–{int(bp['last_season'])} · {int(bp['career_span'])} seasons ·
                        Trend: <span style='color:{"#00C851" if bp["season_trend"]=="improving" else "#FF3D3D" if bp["season_trend"]=="declining" else "#F9CD05"}'>
                        {"📈 Improving" if bp["season_trend"]=="improving" else "📉 Declining" if bp["season_trend"]=="declining" else "➡️ Stable"}</span>
                    </div>
                    """, unsafe_allow_html=True)
                with h2:
                    score = bp['scouting_score']
                    score_col = '#00C851' if score >= 55 else '#FF6B00' if score >= 40 else '#FF3D3D'
                    st.markdown(f"""
                    <div class='scout-score-box'>
                        <div style='font-size:11px;color:#8899BB;letter-spacing:2px'>SCOUTING SCORE</div>
                        <div style='font-size:52px;font-weight:800;color:{score_col}'>{score}</div>
                        <div style='font-size:12px;color:#8899BB'>out of 100</div>
                    </div>
                    """, unsafe_allow_html=True)

                st.markdown("---")

                # ── Core stats ──
                c1,c2,c3,c4,c5,c6 = st.columns(6)
                c1.metric("Wickets", int(bp['total_wickets']))
                c2.metric("Economy", f"{bp['economy']:.2f}")
                c3.metric("Bowling SR", f"{bp['bowling_sr']:.1f}")
                c4.metric("Dot %", f"{bp['dot_pct']:.1f}%")
                c5.metric("Control", f"{100-bp['control_index']:.1f}%", help="100 - (wides+noballs)/balls%")
                c6.metric("Boundary %", f"{bp['boundary_conceded_pct']:.1f}%")

                # ── Phase Economy + Specialist Scores ──
                col_left, col_right = st.columns(2)
                with col_left:
                    st.markdown("<div class='section-title'>Phase Economy</div>", unsafe_allow_html=True)
                    fig, ax = dark_fig(6, 3.5)
                    phases = ['Powerplay', 'Middle', 'Death']
                    econs = [bp['pp_economy'], bp['mid_economy'], bp['death_economy']]
                    bars = ax.bar(phases, econs, color=['#FF6B00', '#1B4FD8', '#EC1C24'], width=0.55,
                                  edgecolor='#0A1628', linewidth=1.5)
                    for bar, val in zip(bars, econs):
                        if val > 0:
                            ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.1,
                                    f'{val:.1f}', ha='center', color='white', fontsize=12, fontweight='bold')
                    ax.axhline(8, color='#3A5070', linestyle='--', linewidth=1, alpha=0.5)
                    ax.set_ylabel('Economy', color='#8899BB')
                    ax.set_title('Economy by Phase', color='white', fontsize=12, fontweight='bold')
                    plt.tight_layout()
                    st.pyplot(fig, use_container_width=True); plt.close()

                with col_right:
                    st.markdown("<div class='section-title'>Specialist Scores</div>", unsafe_allow_html=True)
                    fig, ax = dark_fig(6, 3.5)
                    spec_labels = ['Death\nSpecialist', 'Powerplay\nSpecialist']
                    spec_vals = [bp['death_specialist_score'], bp['pp_specialist_score']]
                    bars = ax.barh(spec_labels, spec_vals, color=['#EC1C24', '#FF6B00'], height=0.45)
                    for bar, val in zip(bars, spec_vals):
                        ax.text(bar.get_width()+1, bar.get_y()+bar.get_height()/2,
                                f'{val:.0f}/100', va='center', color='white', fontsize=12, fontweight='bold')
                    ax.set_xlim(0, 100)
                    ax.set_xlabel('Score', color='#8899BB')
                    ax.set_title('Specialist Abilities', color='white', fontsize=12, fontweight='bold')
                    plt.tight_layout()
                    st.pyplot(fig, use_container_width=True); plt.close()

                # ── Wicket Types + Season Trend ──
                col_wkt, col_trend = st.columns(2)
                with col_wkt:
                    st.markdown("<div class='section-title'>Wicket Type Distribution</div>", unsafe_allow_html=True)
                    fig, ax = dark_fig(5, 3)
                    wkt_types = ['Caught', 'Bowled', 'LBW', 'Stumped']
                    wkt_vals = [bp['caught_pct'], bp['bowled_pct'], bp['lbw_pct'], bp['stumped_pct']]
                    wkt_vals_f = [v for v in wkt_vals if v > 0]
                    wkt_types_f = [t for t, v in zip(wkt_types, wkt_vals) if v > 0]
                    if wkt_vals_f:
                        ax.pie(wkt_vals_f, labels=wkt_types_f,
                               colors=['#FF6B00', '#1B4FD8', '#EC1C24', '#A855F7'],
                               autopct='%1.0f%%',
                               textprops={'color': 'white', 'fontsize': 10},
                               wedgeprops={'linewidth': 2, 'edgecolor': '#0A1628'})
                        ax.set_title('How they take wickets', color='white', fontsize=12, fontweight='bold')
                    plt.tight_layout()
                    st.pyplot(fig, use_container_width=True); plt.close()

                with col_trend:
                    st.markdown("<div class='section-title'>Season Trajectory</div>", unsafe_allow_html=True)
                    bowl_trends = auc_trends[(auc_trends['player'] == sel_b) & (auc_trends['role'] == 'bowler')]
                    if not bowl_trends.empty and len(bowl_trends) >= 2:
                        bowl_trends = bowl_trends.sort_values('season_year')
                        fig, ax = dark_fig(6, 3)
                        ax.plot(bowl_trends['season_year'], bowl_trends['economy'], 'o-',
                                color='#EC1C24', linewidth=2.5, markersize=6, label='Economy')
                        ax.axhline(8, color='#3A5070', linestyle='--', linewidth=1)
                        ax.set_ylabel('Economy', color='#8899BB')
                        ax.set_title('Economy Trend', color='white', fontsize=12, fontweight='bold')
                        ax.legend(facecolor='#111E35', labelcolor='white', fontsize=9)
                        plt.tight_layout()
                        st.pyplot(fig, use_container_width=True); plt.close()
                    else:
                        st.info("Insufficient season data for trajectory")

                # ── Matchup intel ──
                st.markdown("<div class='section-title'>Key Matchups</div>", unsafe_allow_html=True)
                fav_matchups = matchup[matchup['bowler'] == sel_b].copy()
                if not fav_matchups.empty and len(fav_matchups) >= 3:
                    # Best matchup (highest dismissal %, min 12 balls)
                    fav_matchups_sig = fav_matchups[fav_matchups['balls'] >= 12]
                    if not fav_matchups_sig.empty:
                        mc1, mc2 = st.columns(2)
                        with mc1:
                            best = fav_matchups_sig.nlargest(3, 'dismissal_pct')[['batter', 'balls', 'dismissal_pct', 'economy']]
                            st.markdown("**🟢 Favourite Batters (dominates)**")
                            for _, r in best.iterrows():
                                st.markdown(f"- **{r['batter']}**: Dism {r['dismissal_pct']:.0f}%, Econ {r['economy']:.1f} ({int(r['balls'])} balls)")
                        with mc2:
                            worst = fav_matchups_sig.nlargest(3, 'strike_rate')[['batter', 'balls', 'strike_rate', 'economy']]
                            st.markdown("**🔴 Nightmare Batters (struggles)**")
                            for _, r in worst.iterrows():
                                st.markdown(f"- **{r['batter']}**: SR {r['strike_rate']:.0f}, Econ {r['economy']:.1f} ({int(r['balls'])} balls)")

        # ════════════════════════════════════════════════════
        # AUCTION SUB-TAB 2: SMART FILTERS
        # ════════════════════════════════════════════════════
        with auc_sub2:
            st.markdown("<div class='section-title'>Smart Player Search Engine</div>", unsafe_allow_html=True)
            st.caption("Find the perfect player with franchise-level filters across 462 batters and 389 bowlers")

            # ── Quick Filter Presets ──
            st.markdown("**⚡ Quick Filters**")
            qf1, qf2, qf3 = st.columns(3)
            qf4, qf5, qf6 = st.columns(3)

            preset = None
            with qf1:
                if st.button("🔥 Death Finishers", use_container_width=True, key='qf1'):
                    preset = 'death_finisher'
            with qf2:
                if st.button("🎯 PP Bowlers", use_container_width=True, key='qf2'):
                    preset = 'pp_bowler'
            with qf3:
                if st.button("💎 Chase Specialists", use_container_width=True, key='qf3'):
                    preset = 'chase_specialist'
            with qf4:
                if st.button("🧊 Pressure Performers", use_container_width=True, key='qf4'):
                    preset = 'pressure'
            with qf5:
                if st.button("📈 Rising Stars", use_container_width=True, key='qf5'):
                    preset = 'rising'
            with qf6:
                if st.button("🎰 Spin Wizards", use_container_width=True, key='qf6'):
                    preset = 'spin_wizard'

            st.markdown("---")

            # ── Custom Filters ──
            filter_role = st.radio("Search for", ["Batters", "Bowlers"], horizontal=True, key='filter_role')

            if filter_role == "Batters":
                fc1, fc2, fc3, fc4 = st.columns(4)
                with fc1:
                    min_sr = st.slider("Min Strike Rate", 80, 180, 120, key='fsr')
                with fc2:
                    min_avg = st.slider("Min Average", 10, 50, 20, key='favg')
                with fc3:
                    archetype_filter = st.multiselect("Archetype",
                        auc_bat['archetype'].unique().tolist(), key='farch')
                with fc4:
                    trend_filter = st.multiselect("Trend",
                        ['improving', 'stable', 'declining'], key='ftrend')

                fc5, fc6, fc7, fc8 = st.columns(4)
                with fc5:
                    min_score = st.slider("Min Scouting Score", 0, 100, 40, key='fsc')
                with fc6:
                    min_innings = st.slider("Min Innings", 5, 100, 10, key='finn')
                with fc7:
                    min_boundary = st.slider("Min Boundary %", 0, 40, 10, key='fbdry')
                with fc8:
                    max_dot = st.slider("Max Dot %", 20, 60, 50, key='fdot')

                # Apply preset overrides
                if preset == 'death_finisher':
                    results = auc_bat[(auc_bat['death_sr'] >= 150) & (auc_bat['total_innings'] >= 10)]
                elif preset == 'chase_specialist':
                    results = auc_bat[(auc_bat['chase_sr'] >= 135) & (auc_bat['total_innings'] >= 15)]
                elif preset == 'pressure':
                    results = auc_bat[(auc_bat['pressure_sr'] >= 140) & (auc_bat['total_innings'] >= 10)]
                elif preset == 'rising':
                    results = auc_bat[(auc_bat['season_trend'] == 'improving') & (auc_bat['last_season'] >= 2024)]
                else:
                    results = auc_bat.copy()
                    results = results[results['overall_sr'] >= min_sr]
                    results = results[results['overall_avg'] >= min_avg]
                    results = results[results['scouting_score'] >= min_score]
                    results = results[results['total_innings'] >= min_innings]
                    results = results[results['boundary_pct'] >= min_boundary]
                    results = results[results['dot_pct'] <= max_dot]
                    if archetype_filter:
                        results = results[results['archetype'].isin(archetype_filter)]
                    if trend_filter:
                        results = results[results['season_trend'].isin(trend_filter)]

                results = results.sort_values('scouting_score', ascending=False)

                st.markdown(f"<div class='section-title'>Results — {len(results)} players found</div>", unsafe_allow_html=True)

                if len(results) > 0:
                    display_cols = ['batter', 'scouting_score', 'archetype', 'overall_sr', 'overall_avg',
                                    'boundary_pct', 'death_sr', 'intent_score', 'consistency', 'season_trend']
                    display_df = results[display_cols].head(25).copy()
                    display_df.columns = ['Player', 'Score', 'Archetype', 'SR', 'Avg',
                                          'Boundary%', 'Death SR', 'Intent', 'Consistency', 'Trend']
                    display_df.index = range(1, len(display_df)+1)
                    st.dataframe(display_df, use_container_width=True, height=400)
                else:
                    st.info("No players match your filters. Try relaxing some criteria.")

            else:  # Bowlers
                fc1, fc2, fc3, fc4 = st.columns(4)
                with fc1:
                    max_econ = st.slider("Max Economy", 5.0, 12.0, 8.5, step=0.5, key='fbecon')
                with fc2:
                    min_wkts = st.slider("Min Wickets", 5, 200, 20, key='fbwkt')
                with fc3:
                    b_arch_filter = st.multiselect("Archetype",
                        auc_bowl['archetype'].unique().tolist(), key='fbarch')
                with fc4:
                    b_type_filter = st.multiselect("Bowler Type",
                        ['spin', 'pace'], key='fbtype')

                fc5, fc6, fc7, fc8 = st.columns(4)
                with fc5:
                    min_b_score = st.slider("Min Scouting Score", 0, 100, 30, key='fbsc')
                with fc6:
                    min_dot_b = st.slider("Min Dot %", 20, 50, 25, key='fbdot')
                with fc7:
                    max_death_econ = st.slider("Max Death Economy", 5.0, 14.0, 10.0, step=0.5, key='fbde')
                with fc8:
                    min_death_spec = st.slider("Min Death Spec Score", 0, 100, 0, key='fbds')

                # Apply preset overrides
                if preset == 'pp_bowler':
                    bresults = auc_bowl[(auc_bowl['pp_economy'] > 0) & (auc_bowl['pp_economy'] <= 7.5) &
                                        (auc_bowl['pp_specialist_score'] >= 30)]
                elif preset == 'spin_wizard':
                    bresults = auc_bowl[(auc_bowl['bowler_type'] == 'spin') & (auc_bowl['economy'] <= 8) &
                                        (auc_bowl['total_wickets'] >= 20)]
                elif preset == 'rising':
                    bresults = auc_bowl[(auc_bowl['season_trend'] == 'improving') & (auc_bowl['last_season'] >= 2024)]
                elif preset == 'pressure':
                    bresults = auc_bowl[(auc_bowl['pressure_economy'] <= 7.5) & (auc_bowl['total_balls'] >= 200)]
                else:
                    bresults = auc_bowl.copy()
                    bresults = bresults[bresults['economy'] <= max_econ]
                    bresults = bresults[bresults['total_wickets'] >= min_wkts]
                    bresults = bresults[bresults['scouting_score'] >= min_b_score]
                    bresults = bresults[bresults['dot_pct'] >= min_dot_b]
                    bresults = bresults[bresults['death_economy'] <= max_death_econ]
                    bresults = bresults[bresults['death_specialist_score'] >= min_death_spec]
                    if b_arch_filter:
                        bresults = bresults[bresults['archetype'].isin(b_arch_filter)]
                    if b_type_filter:
                        bresults = bresults[bresults['bowler_type'].isin(b_type_filter)]

                bresults = bresults.sort_values('scouting_score', ascending=False)

                st.markdown(f"<div class='section-title'>Results — {len(bresults)} bowlers found</div>", unsafe_allow_html=True)

                if len(bresults) > 0:
                    display_cols = ['bowler', 'scouting_score', 'archetype', 'bowler_type', 'economy',
                                    'total_wickets', 'dot_pct', 'death_economy', 'death_specialist_score', 'season_trend']
                    display_df = bresults[display_cols].head(25).copy()
                    display_df.columns = ['Player', 'Score', 'Archetype', 'Type', 'Economy',
                                          'Wickets', 'Dot%', 'Death Econ', 'Death Spec', 'Trend']
                    display_df.index = range(1, len(display_df)+1)
                    st.dataframe(display_df, use_container_width=True, height=400)
                else:
                    st.info("No bowlers match your filters. Try relaxing some criteria.")

        # ════════════════════════════════════════════════════
        # AUCTION SUB-TAB 3: H2H DEEP DIVE
        # ════════════════════════════════════════════════════
        with auc_sub3:
            st.markdown("<div class='section-title'>Head-to-Head Deep Dive — Auction Context</div>", unsafe_allow_html=True)
            st.caption("Analyse how a target player performs against specific opponents")

            h2h_mode = st.radio("Analysis Mode", ["Player vs Player", "Player vs Team Attack"], horizontal=True, key='h2h_mode')

            if h2h_mode == "Player vs Player":
                hc1, hc2 = st.columns(2)
                with hc1:
                    all_auc_bowlers_h = sorted(auc_bowl['bowler'].unique().tolist())
                    h_bowl = st.selectbox("Bowler", all_auc_bowlers_h,
                        index=all_auc_bowlers_h.index('JJ Bumrah') if 'JJ Bumrah' in all_auc_bowlers_h else 0,
                        key='h2h_bowl')
                with hc2:
                    all_auc_batters_h = sorted(auc_bat['batter'].unique().tolist())
                    h_bat = st.selectbox("Batter", all_auc_batters_h,
                        index=all_auc_batters_h.index('V Kohli') if 'V Kohli' in all_auc_batters_h else 0,
                        key='h2h_bat')

                if st.button("⚡ Analyse", use_container_width=True, key='h2h_go'):
                    mx = matchup[(matchup['bowler']==h_bowl)&(matchup['batter']==h_bat)]
                    if mx.empty:
                        st.warning(f"No data for {h_bowl} vs {h_bat}")
                    else:
                        mx = mx.iloc[0]
                        balls=int(mx['balls']); runs=int(mx['runs']); dismi=int(mx['dismissals'])
                        sr=float(mx['strike_rate']); econ=float(mx['economy'])
                        dism_pct=float(mx['dismissal_pct']); dot_pct_h=float(mx['dot_pct'])
                        bdry_pct_h=float(mx['boundary_pct'])

                        if dism_pct > 10 or (sr < 100 and dot_pct_h > 40):
                            verdict="🟢 BOWLER DOMINATES"; vcol="#00C851"
                        elif sr > 160 or bdry_pct_h > 35:
                            verdict="🔴 BATTER DOMINATES"; vcol="#FF3D3D"
                        else:
                            verdict="🟡 EVEN CONTEST"; vcol="#F9CD05"

                        st.markdown(f"""
                        <div style='background:{vcol}18;border:2px solid {vcol}66;border-radius:14px;
                             padding:20px;text-align:center;margin:16px 0'>
                            <div style='font-size:22px;font-weight:800;color:{vcol}'>{verdict}</div>
                            <div style='color:#8899BB;margin-top:6px'>{h_bowl} vs {h_bat} · {balls} balls</div>
                        </div>""", unsafe_allow_html=True)

                        c1,c2,c3,c4,c5 = st.columns(5)
                        c1.metric("Balls", balls)
                        c2.metric("Runs", runs)
                        c3.metric("Dismissals", dismi)
                        c4.metric("SR", f"{sr:.1f}")
                        c5.metric("Dism %", f"{dism_pct:.1f}%")

                        # Bowler & batter scouting context side by side
                        batter_prof = auc_bat[auc_bat['batter'] == h_bat]
                        bowler_prof = auc_bowl[auc_bowl['bowler'] == h_bowl]
                        if not batter_prof.empty and not bowler_prof.empty:
                            bpr = batter_prof.iloc[0]
                            bwr = bowler_prof.iloc[0]
                            st.markdown("<div class='section-title'>Scouting Context</div>", unsafe_allow_html=True)
                            sc1, sc2 = st.columns(2)
                            with sc1:
                                st.markdown(f"""
                                <div class='card-orange' style='text-align:center'>
                                    <div style='font-size:18px;font-weight:700;color:#FF6B00'>{h_bat}</div>
                                    <div style='color:#8899BB;font-size:12px'>{bpr['archetype']} · Score: {bpr['scouting_score']}</div>
                                    <div style='color:white;margin-top:8px'>SR {bpr['overall_sr']} · Avg {bpr['overall_avg']}</div>
                                </div>""", unsafe_allow_html=True)
                            with sc2:
                                st.markdown(f"""
                                <div class='card-blue' style='text-align:center'>
                                    <div style='font-size:18px;font-weight:700;color:#1B4FD8'>{h_bowl}</div>
                                    <div style='color:#8899BB;font-size:12px'>{bwr['archetype']} · Score: {bwr['scouting_score']}</div>
                                    <div style='color:white;margin-top:8px'>Econ {bwr['economy']} · SR {bwr['bowling_sr']:.0f}</div>
                                </div>""", unsafe_allow_html=True)

            else:  # Player vs Team Attack
                hc1, hc2 = st.columns(2)
                with hc1:
                    target_bat = st.selectbox("Target Batter",
                        sorted(auc_bat['batter'].unique().tolist()),
                        index=sorted(auc_bat['batter'].unique().tolist()).index('V Kohli') if 'V Kohli' in auc_bat['batter'].unique() else 0,
                        key='h2h_target')
                with hc2:
                    target_team = st.selectbox("Against Team", CURRENT_TEAMS, key='h2h_team')

                if st.button("⚡ Analyse vs Team", use_container_width=True, key='h2h_team_go'):
                    # Find all bowlers who bowled for this team
                    team_bowler_matchups = matchup[
                        (matchup['batter'] == target_bat)
                    ].merge(
                        auc_bowl[['bowler', 'archetype', 'scouting_score', 'bowler_type']],
                        on='bowler', how='inner'
                    )

                    if len(team_bowler_matchups) > 0:
                        st.markdown(f"<div class='section-title'>{target_bat} vs All Bowlers</div>", unsafe_allow_html=True)
                        top_matchups = team_bowler_matchups[team_bowler_matchups['balls'] >= 6].sort_values('strike_rate', ascending=False)

                        if not top_matchups.empty:
                            display_m = top_matchups[['bowler', 'balls', 'runs', 'dismissals',
                                                       'strike_rate', 'economy', 'dismissal_pct', 'bowler_type']].head(15)
                            display_m.columns = ['Bowler', 'Balls', 'Runs', 'Dismissals',
                                                  'SR', 'Economy', 'Dism%', 'Type']
                            display_m.index = range(1, len(display_m)+1)
                            st.dataframe(display_m, use_container_width=True)
                    else:
                        st.info("Not enough matchup data available")

        # ════════════════════════════════════════════════════
        # AUCTION SUB-TAB 4: AUCTION RECOMMENDATION ENGINE
        # ════════════════════════════════════════════════════
        with auc_sub4:
            st.markdown("<div class='section-title'>Auction Recommendation Engine</div>", unsafe_allow_html=True)
            st.caption("Build your squad — get AI-powered recommendations for who to bid on")

            # ── Squad Builder ──
            ac1, ac2 = st.columns([1, 1])
            with ac1:
                franchise = st.selectbox("🏏 Select Franchise", CURRENT_TEAMS, key='auc_team')
            with ac2:
                budget = st.slider("💰 Remaining Budget (Crores)", 10, 120, 60, key='auc_budget')

            # Retained players
            all_players = sorted(set(auc_bat['batter'].tolist() + auc_bowl['bowler'].tolist()))
            retained = st.multiselect("✅ Retained / Already Bought Players", all_players, key='auc_retained')

            slots_remaining = st.slider("Slots Remaining", 1, 18, 12, key='auc_slots')

            if st.button("🧠 Generate Recommendations", type="primary", use_container_width=True, key='auc_reco'):

                # ── Analyse retained squad composition ──
                retained_archetypes = []
                retained_bat_count = 0
                retained_bowl_count = 0
                retained_finisher = False
                retained_pp_bowler = False
                retained_death_bowler = False
                retained_spinner = False

                for rp in retained:
                    bp = auc_bat[auc_bat['batter'] == rp]
                    if not bp.empty:
                        retained_bat_count += 1
                        arch = bp.iloc[0]['archetype']
                        retained_archetypes.append(arch)
                        if arch == 'Finisher': retained_finisher = True

                    bwp = auc_bowl[auc_bowl['bowler'] == rp]
                    if not bwp.empty:
                        retained_bowl_count += 1
                        arch = bwp.iloc[0]['archetype']
                        retained_archetypes.append(arch)
                        if arch == 'Death Specialist': retained_death_bowler = True
                        if arch == 'Powerplay Specialist': retained_pp_bowler = True
                        if bwp.iloc[0]['bowler_type'] == 'spin': retained_spinner = True

                # ── Squad Void Analysis ──
                st.markdown("<div class='section-title'>Squad Void Analysis</div>", unsafe_allow_html=True)

                # Ideal composition
                needs = []
                if retained_bat_count < 6: needs.append(('Top-Order Batter', 6 - retained_bat_count))
                if not retained_finisher: needs.append(('Finisher', 1))
                if retained_bowl_count < 5: needs.append(('Bowler', 5 - retained_bowl_count))
                if not retained_death_bowler: needs.append(('Death Bowler', 1))
                if not retained_pp_bowler: needs.append(('PP Bowler', 1))
                if not retained_spinner: needs.append(('Spinner', 1))

                # Radar chart of squad balance
                categories = ['Batting\nDepth', 'Bowling\nDepth', 'Finishers', 'Death\nBowling', 'PP\nBowling', 'Spin\nOptions']
                ideal = [6, 5, 2, 2, 2, 2]
                actual = [
                    min(retained_bat_count, 6),
                    min(retained_bowl_count, 5),
                    2 if retained_finisher else 0,
                    2 if retained_death_bowler else 0,
                    2 if retained_pp_bowler else 0,
                    2 if retained_spinner else 0,
                ]

                fig, ax = dark_fig(8, 4)
                x = np.arange(len(categories))
                ax.bar(x - 0.2, ideal, 0.35, label='Ideal', color='#1B4FD8', alpha=0.4, edgecolor='#1B4FD8')
                ax.bar(x + 0.2, actual, 0.35, label='Current', color='#FF6B00', edgecolor='#FF6B00')
                ax.set_xticks(x)
                ax.set_xticklabels(categories, color='white', fontsize=10)
                ax.set_ylabel('Players', color='#8899BB')
                ax.set_title(f'{TEAM_SHORT.get(franchise, franchise)} — Squad Composition vs Ideal',
                            color='white', fontsize=13, fontweight='bold')
                ax.legend(facecolor='#111E35', labelcolor='white')
                plt.tight_layout()
                st.pyplot(fig, use_container_width=True); plt.close()

                if needs:
                    st.markdown("**🔴 Voids to fill:**")
                    for need, count in needs:
                        st.markdown(f"- {need}: **{count} needed**")
                else:
                    st.success("Squad looks well-balanced!")

                # ── Generate Recommendations ──
                st.markdown("<div class='section-title'>Recommended Targets</div>", unsafe_allow_html=True)

                per_player_budget = budget / max(slots_remaining, 1)

                # Score all available batters
                avail_bat = auc_bat[~auc_bat['batter'].isin(retained)].copy()
                avail_bat['team_fit'] = 50.0  # Base
                if not retained_finisher:
                    avail_bat.loc[avail_bat['archetype'] == 'Finisher', 'team_fit'] += 30
                if retained_bat_count < 4:
                    avail_bat.loc[avail_bat['archetype'].isin(['Anchor', 'Aggressor', 'All-Phase']), 'team_fit'] += 20
                # Recency bonus
                avail_bat.loc[avail_bat['last_season'] >= 2025, 'team_fit'] += 10
                avail_bat.loc[avail_bat['season_trend'] == 'improving', 'team_fit'] += 10
                avail_bat['team_fit'] = avail_bat['team_fit'].clip(0, 100)
                avail_bat['combined_score'] = (avail_bat['scouting_score'] * 0.6 +
                                               avail_bat['team_fit'] * 0.4)

                # Score all available bowlers
                avail_bowl = auc_bowl[~auc_bowl['bowler'].isin(retained)].copy()
                avail_bowl['team_fit'] = 50.0
                if not retained_death_bowler:
                    avail_bowl.loc[avail_bowl['archetype'] == 'Death Specialist', 'team_fit'] += 30
                if not retained_pp_bowler:
                    avail_bowl.loc[avail_bowl['archetype'] == 'Powerplay Specialist', 'team_fit'] += 25
                if not retained_spinner:
                    avail_bowl.loc[avail_bowl['bowler_type'] == 'spin', 'team_fit'] += 20
                if retained_bowl_count < 3:
                    avail_bowl['team_fit'] += 15
                avail_bowl.loc[avail_bowl['last_season'] >= 2025, 'team_fit'] += 10
                avail_bowl.loc[avail_bowl['season_trend'] == 'improving', 'team_fit'] += 10
                avail_bowl['team_fit'] = avail_bowl['team_fit'].clip(0, 100)
                avail_bowl['combined_score'] = (avail_bowl['scouting_score'] * 0.6 +
                                                avail_bowl['team_fit'] * 0.4)

                # Top recommendations
                top_bat = avail_bat.nlargest(8, 'combined_score')
                top_bowl = avail_bowl.nlargest(7, 'combined_score')

                # ── Display Batter Recommendations ──
                st.markdown("**🏏 Batter Targets**")
                for _, row in top_bat.iterrows():
                    # Bid recommendation
                    if row['combined_score'] >= 70:
                        bid = '🟢 BID AGGRESSIVELY'
                        bid_col = '#00C851'
                    elif row['combined_score'] >= 55:
                        bid = '🟡 BID MODERATELY'
                        bid_col = '#F9CD05'
                    else:
                        bid = '🔵 VALUE PICK'
                        bid_col = '#1B4FD8'

                    # Risk
                    risk_factors = []
                    if row['career_span'] >= 12: risk_factors.append('veteran')
                    if row['season_trend'] == 'declining': risk_factors.append('declining form')
                    if row['consistency'] < 0.2: risk_factors.append('inconsistent')
                    risk_text = ', '.join(risk_factors) if risk_factors else 'low risk'

                    arch_c = ARCHETYPE_COLORS.get(row['archetype'], '#8899BB')
                    st.markdown(f"""
                    <div class='filter-result-row'>
                        <div>
                            <span style='font-size:16px;font-weight:700;color:white'>{row['batter']}</span>
                            <span class='archetype-badge' style='background:{arch_c}33;color:{arch_c};
                                  border:1px solid {arch_c};margin-left:8px;font-size:10px'>{row['archetype']}</span>
                            <br><span style='color:#8899BB;font-size:12px'>SR {row['overall_sr']:.0f} · Avg {row['overall_avg']:.0f} ·
                            Score: {row['scouting_score']} · Fit: {row['team_fit']:.0f} · Risk: {risk_text}</span>
                        </div>
                        <div>
                            <span class='bid-tag' style='background:{bid_col}22;color:{bid_col};border:1px solid {bid_col}'>{bid}</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

                st.markdown("")
                st.markdown("**🎳 Bowler Targets**")
                for _, row in top_bowl.iterrows():
                    if row['combined_score'] >= 55:
                        bid = '🟢 BID AGGRESSIVELY'
                        bid_col = '#00C851'
                    elif row['combined_score'] >= 42:
                        bid = '🟡 BID MODERATELY'
                        bid_col = '#F9CD05'
                    else:
                        bid = '🔵 VALUE PICK'
                        bid_col = '#1B4FD8'

                    risk_factors = []
                    if row['career_span'] >= 12: risk_factors.append('veteran')
                    if row['season_trend'] == 'declining': risk_factors.append('declining form')
                    if row['control_index'] > 3: risk_factors.append('control issues')
                    risk_text = ', '.join(risk_factors) if risk_factors else 'low risk'

                    arch_c = ARCHETYPE_COLORS.get(row['archetype'], '#8899BB')
                    st.markdown(f"""
                    <div class='filter-result-row'>
                        <div>
                            <span style='font-size:16px;font-weight:700;color:white'>{row['bowler']}</span>
                            <span class='archetype-badge' style='background:{arch_c}33;color:{arch_c};
                                  border:1px solid {arch_c};margin-left:8px;font-size:10px'>{row['archetype']}</span>
                            <span style='color:#3A5070;font-size:11px;margin-left:6px'>({row['bowler_type'].upper()})</span>
                            <br><span style='color:#8899BB;font-size:12px'>Econ {row['economy']:.1f} · Wkts {row['total_wickets']} ·
                            Score: {row['scouting_score']} · Fit: {row['team_fit']:.0f} · Risk: {risk_text}</span>
                        </div>
                        <div>
                            <span class='bid-tag' style='background:{bid_col}22;color:{bid_col};border:1px solid {bid_col}'>{bid}</span>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)

                # ── Summary ──
                st.markdown("---")
                st.markdown(f"""
                <div class='card' style='text-align:center'>
                    <div style='font-size:13px;color:#8899BB;letter-spacing:2px'>RECOMMENDATION SUMMARY</div>
                    <div style='color:white;margin-top:8px;font-size:14px'>
                        💰 Budget: ₹{budget}Cr · 📋 Slots: {slots_remaining} ·
                        🏏 Batter targets: {len(top_bat)} · 🎳 Bowler targets: {len(top_bowl)}
                    </div>
                    <div style='color:#8899BB;font-size:12px;margin-top:6px'>
                        Avg budget per player: ₹{per_player_budget:.1f}Cr
                    </div>
                </div>
                """, unsafe_allow_html=True)

# ── Footer ───────────────────────────────────────────────────
st.markdown(f"""
<div class='criciq-footer'>
    CricIQ · 1,175 IPL matches · 279,586 deliveries · 2008–2026 · {model_label}
    <br>Built with XGBoost + LightGBM · SHAP explainability · 60+ engineered features
    <br>Auction Intelligence: 462 batter profiles · 389 bowler profiles · 40+ scouting metrics
</div>
""", unsafe_allow_html=True)
