import { formatPrice, getScoreColor } from '../../utils/formatStats';
import { ARCHETYPE_COLORS } from '../../utils/teamColors';

export default function PlayerBidCard({ data, onAdd }) {
  if (!data) return null;
  const { player, role, archetype, scoutingScore, tier, bidRange, factors } = data;
  const scoreColor = getScoreColor(scoutingScore);
  const archColor = ARCHETYPE_COLORS[archetype] || '#8899BB';

  const tierColors = { Premium: '#00C851', 'High Value': '#FF6B00', 'Mid Tier': '#F9CD05', Budget: '#8899BB' };

  return (
    <div className="card card-accent-orange" style={{ animation: 'slideUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800 }}>{player}</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span className="badge badge-sm" style={{ background: `${archColor}22`, color: archColor }}>{archetype}</span>
            <span className="badge badge-sm" style={{ color: 'var(--text-muted)' }}>{role}</span>
            <span className="badge badge-sm" style={{ background: `${tierColors[tier]}22`, color: tierColors[tier] }}>{tier}</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: scoreColor }}>{scoutingScore?.toFixed(0)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SCORE</div>
        </div>
      </div>

      {bidRange && (
        <div className="grid-3" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-label">Min Bid</div><div className="stat-value" style={{ fontSize: 18 }}>{formatPrice(bidRange.minLakh)}</div></div>
          <div className="stat-card" style={{ borderColor: 'var(--accent-orange)' }}>
            <div className="stat-label">Recommended</div><div className="stat-value" style={{ fontSize: 18, color: 'var(--accent-orange)' }}>{formatPrice(bidRange.recommendedLakh)}</div>
          </div>
          <div className="stat-card"><div className="stat-label">Max Bid</div><div className="stat-value" style={{ fontSize: 18 }}>{formatPrice(bidRange.maxLakh)}</div></div>
        </div>
      )}

      {onAdd && (
        <button className="btn btn-primary btn-full" onClick={() => onAdd(data)}>
          ➕ Add to Squad
        </button>
      )}
    </div>
  );
}
