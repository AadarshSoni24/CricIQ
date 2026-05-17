export default function PhaseChart({ phases, type = 'batting' }) {
  if (!phases) return null;
  const phaseNames = ['powerplay', 'middle', 'death'];
  const colors = ['#FF6B00', '#1B4FD8', '#EC1C24'];
  const metric = type === 'batting' ? 'sr' : 'economy';
  const label = type === 'batting' ? 'SR' : 'Econ';
  const values = phaseNames.map(p => phases[p]?.[metric] || phases?.bowling?.[p]?.[metric] || 0);
  const max = Math.max(...values, 1);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 160 }}>
      {phaseNames.map((p, i) => (
        <div key={p} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{values[i]?.toFixed(1)}</span>
          <div style={{
            width: '100%', borderRadius: 8,
            background: `${colors[i]}33`, height: `${(values[i] / max) * 100}%`,
            minHeight: 8, position: 'relative',
            transition: 'height 0.6s ease',
          }}>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '100%', background: colors[i], borderRadius: 8, opacity: 0.8,
            }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p}</span>
        </div>
      ))}
    </div>
  );
}
