export default function BidRecommendation({ data }) {
  if (!data?.factors) return null;
  const { factors } = data;
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h4 className="section-title">Valuation Factors</h4>
      <div className="grid-2">
        <div className="stat-card">
          <div className="stat-label">Impact Score</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{factors.impactScore}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Archetype Multiplier</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{factors.archetypeMultiplier}x</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Trend</div>
          <div className="stat-value" style={{ fontSize: 16 }}>
            {factors.seasonTrend === 'improving' ? '📈' : factors.seasonTrend === 'declining' ? '📉' : '➡️'} {factors.seasonTrend}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Trend Multiplier</div>
          <div className="stat-value" style={{ fontSize: 20 }}>{factors.trendMultiplier}x</div>
        </div>
      </div>
    </div>
  );
}
