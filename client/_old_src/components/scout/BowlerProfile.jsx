import { formatEconomy, formatPct } from '../../utils/formatStats';

export default function BowlerProfile({ profile, phases }) {
  if (!profile) return null;
  return (
    <div>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Wickets</div><div className="stat-value">{profile.totalWickets}</div></div>
        <div className="stat-card"><div className="stat-label">Economy</div><div className="stat-value">{formatEconomy(profile.economy)}</div></div>
        <div className="stat-card"><div className="stat-label">Bowling SR</div><div className="stat-value">{profile.bowlingSR?.toFixed(1)}</div></div>
      </div>
      <div className="grid-3">
        <div className="stat-card"><div className="stat-label">Dot %</div><div className="stat-value">{formatPct(profile.dotPct)}</div></div>
        <div className="stat-card"><div className="stat-label">Death Specialist</div><div className="stat-value">{profile.deathSpecialist?.toFixed(0)}</div></div>
        <div className="stat-card"><div className="stat-label">Type</div><div className="stat-value" style={{ fontSize: 18 }}>{profile.bowlerType === 'spin' ? '🌀 Spin' : '💨 Pace'}</div></div>
      </div>

      {phases?.bowling && (
        <div style={{ marginTop: 24 }}>
          <h4 className="section-title">Phase Economy</h4>
          <div className="grid-3">
            {['powerplay', 'middle', 'death'].map(ph => (
              <div key={ph} className="stat-card card-accent-blue">
                <div className="stat-label">{ph}</div>
                <div className="stat-value">{formatEconomy(phases.bowling[ph]?.economy)}</div>
                <div className="stat-sub">{phases.bowling[ph]?.wickets || 0} wkts</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
