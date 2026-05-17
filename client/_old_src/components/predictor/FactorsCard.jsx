export default function FactorsCard({ shapFactors = [], team1, team2 }) {
  if (!shapFactors.length) return null;

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 className="section-title">Why this prediction? — SHAP Factors</h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        🟠 Orange = favours {team1} · 🔵 Blue = favours {team2}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shapFactors.slice(0, 8).map((f, i) => {
          const positive = f.impact > 0;
          const barColor = positive ? '#FF6B00' : '#1B4FD8';
          const width = Math.min(Math.abs(f.impact) * 200, 100);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: '0 0 200px', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right' }}>
                {f.plainText?.split(':')[0] || f.factor}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  height: 20, width: `${width}%`, borderRadius: 4,
                  background: barColor, minWidth: 4,
                  transition: 'width 0.8s ease',
                }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {Math.abs(f.impact).toFixed(3)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
