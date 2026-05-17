import { getTeamColor, getTeamShort } from '../../utils/teamColors';

export default function TeamBadge({ team, size = 'md' }) {
  const color = getTeamColor(team);
  const short = getTeamShort(team);
  const sizes = { sm: { fs: 11, p: '3px 10px' }, md: { fs: 13, p: '5px 14px' }, lg: { fs: 16, p: '8px 20px' } };
  const s = sizes[size] || sizes.md;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: s.p, borderRadius: 9999,
      background: `${color}18`, color: color,
      border: `1px solid ${color}44`,
      fontSize: s.fs, fontWeight: 700, letterSpacing: 0.5,
    }}>
      {short}
    </span>
  );
}
