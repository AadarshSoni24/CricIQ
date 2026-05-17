import { formatSR, formatAvg, formatPct } from '../../utils/formatStats';

export default function BatterProfile({ profile, phases }) {
  if (!profile) return null;
  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Runs</div><div className="stat-value">{profile.totalRuns?.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">Strike Rate</div><div className="stat-value">{formatSR(profile.overallSR)}</div></div>
        <div className="stat-card"><div className="stat-label">Average</div><div className="stat-value">{formatAvg(profile.overallAvg)}</div></div>
      </div>
      <div className="grid-4">
        <div className="stat-card"><div className="stat-label">Innings</div><div className="stat-value">{profile.totalInnings}</div></div>
        <div className="stat-card"><div className="stat-label">Boundary %</div><div className="stat-value">{formatPct(profile.boundaryPct)}</div></div>
        <div className="stat-card"><div className="stat-label">Dot %</div><div className="stat-value">{formatPct(profile.dotPct)}</div></div>
        <div className="stat-card"><div className="stat-label">Consistency</div><div className="stat-value">{(profile.consistency * 100)?.toFixed(0)}%</div></div>
      </div>

      {phases && (
        <div style={{ marginTop: 24 }}>
          <h4 className="section-title">Phase Performance</h4>
          <div className="grid-3">
            {['powerplay', 'middle', 'death'].map(ph => (
              <div key={ph} className="stat-card card-accent-orange">
                <div className="stat-label">{ph}</div>
                <div className="stat-value">{formatSR(phases[ph]?.sr)}</div>
                <div className="stat-sub">{phases[ph]?.runs || 0} runs</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h4 className="section-title">vs Spin & Pace</h4>
        <div className="grid-2">
          <div className="stat-card" style={{ borderLeft: '3px solid #A855F7' }}>
            <div className="stat-label">vs Spin SR</div>
            <div className="stat-value">{formatSR(profile.srVsSpin)}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #3B82F6' }}>
            <div className="stat-label">vs Pace SR</div>
            <div className="stat-value">{formatSR(profile.srVsPace)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
