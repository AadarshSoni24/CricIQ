import { getTeamColor } from '../../utils/teamColors';

export default function WinnerBanner({ winner, confidence, team1, team2 }) {
  const color = getTeamColor(winner);
  return (
    <div style={{
      background: `${color}12`, border: `2px solid ${color}66`,
      borderRadius: 16, padding: '32px 24px', textAlign: 'center',
      margin: '24px 0', animation: 'slideUp 0.5s ease',
    }}>
      <div style={{ fontSize: 12, letterSpacing: 3, color: '#8899BB', textTransform: 'uppercase', marginBottom: 8 }}>
        ⚡ Predicted Winner
      </div>
      <div style={{ fontSize: 42, fontWeight: 900, color, marginBottom: 8 }}>{winner}</div>
      <div style={{ fontSize: 16, color: '#ccc' }}>
        {confidence?.toFixed(1)}% confidence
      </div>
    </div>
  );
}
