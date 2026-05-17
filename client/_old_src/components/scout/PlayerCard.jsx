import { ARCHETYPE_COLORS } from '../../utils/teamColors';
import { getScoreColor } from '../../utils/formatStats';
import { useNavigate } from 'react-router-dom';
import './PlayerCard.css';

export default function PlayerCard({ player }) {
  const navigate = useNavigate();
  const archColor = ARCHETYPE_COLORS[player.archetype] || '#8899BB';
  const scoreColor = getScoreColor(player.scoutingScore);

  return (
    <div className="player-card card" onClick={() => navigate(`/player/${encodeURIComponent(player.name)}`)}>
      <div className="player-card-header">
        <div>
          <h3 className="player-card-name">{player.name}</h3>
          <span className="badge" style={{ background: `${archColor}22`, color: archColor, border: `1px solid ${archColor}44` }}>
            {player.archetype}
          </span>
        </div>
        <div className="player-card-score" style={{ color: scoreColor, borderColor: `${scoreColor}44` }}>
          {player.scoutingScore?.toFixed(0)}
        </div>
      </div>
      <div className="player-card-meta">
        <span className="player-card-role">{player.role}</span>
        <span className="player-card-headline">{player.headline}</span>
      </div>
    </div>
  );
}
