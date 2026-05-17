import { getTeamColor, getTeamShort } from '../../utils/teamColors';
import './ProbabilityArc.css';

export default function ProbabilityArc({ team1, team2, team1Prob, team2Prob }) {
  const c1 = getTeamColor(team1);
  const c2 = getTeamColor(team2);
  const s1 = getTeamShort(team1);
  const s2 = getTeamShort(team2);

  return (
    <div className="prob-arc">
      <div className="prob-card" style={{ borderColor: `${c1}55` }}>
        <span className="prob-label">{s1}</span>
        <span className="prob-value" style={{ color: c1 }}>{team1Prob?.toFixed(1)}%</span>
        <span className="prob-team">{team1}</span>
      </div>

      <div className="prob-bar-wrapper">
        <div className="prob-bar">
          <div className="prob-bar-fill left" style={{ width: `${team1Prob}%`, background: c1 }}>
            <span>{team1Prob?.toFixed(0)}%</span>
          </div>
          <div className="prob-bar-fill right" style={{ width: `${team2Prob}%`, background: c2 }}>
            <span>{team2Prob?.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="prob-card" style={{ borderColor: `${c2}55` }}>
        <span className="prob-label">{s2}</span>
        <span className="prob-value" style={{ color: c2 }}>{team2Prob?.toFixed(1)}%</span>
        <span className="prob-team">{team2}</span>
      </div>
    </div>
  );
}
