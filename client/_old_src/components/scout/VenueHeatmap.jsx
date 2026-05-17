export default function VenueHeatmap({ venues = [] }) {
  if (!venues.length) return <p style={{ color: 'var(--text-muted)' }}>No venue data available</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {venues.slice(0, 8).map((v, i) => (
        <div key={i} className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{v.venue?.split(',')[0]?.substring(0, 30)}</span>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <span style={{ color: 'var(--accent-orange)' }}>{v.runs || 0} runs</span>
            <span style={{ color: 'var(--accent-blue)' }}>SR {v.sr?.toFixed(1) || '—'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
