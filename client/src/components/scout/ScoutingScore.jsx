import { getScoreColor, getTrendIcon, getTrendColor } from '../../utils/formatStats';
import { ARCHETYPE_COLORS } from '../../utils/teamColors';

export default function ScoutingScore({ score, archetype, trend }) {
  const scoreColor = getScoreColor(score);
  const archColor = ARCHETYPE_COLORS[archetype] || '#8899BB';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0A1628, #1B2B4B)',
      border: '2px solid var(--accent-orange)',
      borderRadius: 16, padding: 28, textAlign: 'center',
    }}>
      <div className="label" style={{ marginBottom: 8 }}>Scouting Score</div>
      <div style={{ fontSize: 64, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score?.toFixed(0)}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>out of 100</div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
        <span className="badge" style={{ background: `${archColor}22`, color: archColor, border: `1px solid ${archColor}44` }}>
          {archetype}
        </span>
        <span className="badge" style={{ background: `${getTrendColor(trend)}22`, color: getTrendColor(trend) }}>
          {getTrendIcon(trend)} {trend}
        </span>
      </div>
    </div>
  );
}
