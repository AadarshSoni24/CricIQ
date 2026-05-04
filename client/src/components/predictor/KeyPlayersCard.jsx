export default function KeyPlayersCard({ venueInfo }) {
  if (!venueInfo) return null;

  const pitchIcon = {
    batting_friendly: '🏏 Batting Friendly',
    balanced: '⚖️ Balanced',
    bowling_friendly: '🎳 Bowling Friendly',
  };

  return (
    <div className="grid-4" style={{ marginTop: 24 }}>
      <div className="stat-card">
        <div className="stat-label">Pitch Type</div>
        <div className="stat-value" style={{ fontSize: 18 }}>{pitchIcon[venueInfo.pitch_dna] || '⚖️ Balanced'}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Avg 1st Innings</div>
        <div className="stat-value">{venueInfo.avg_1st_innings?.toFixed(0) || '165'}</div>
        <div className="stat-sub">runs</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Bat First Wins</div>
        <div className="stat-value">{((venueInfo.bat_first_win_pct || 0.5) * 100).toFixed(0)}%</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Matches Played</div>
        <div className="stat-value">{venueInfo.matches_played || '—'}</div>
      </div>
    </div>
  );
}
