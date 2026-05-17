import { useState, useEffect } from 'react';
import { getPlayerList, getMatchup } from '../services/api';
import LoadingScreen from '../components/common/LoadingScreen';
import './MatchupExplorer.css';

export default function MatchupExplorer() {
  const [players, setPlayers] = useState({ batters: [], bowlers: [] });
  const [selectedBatter, setSelectedBatter] = useState('');
  const [selectedBowler, setSelectedBowler] = useState('');
  const [matchupData, setMatchupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayerList()
      .then(data => {
        setPlayers(data);
        if (data.batters.length > 0) setSelectedBatter('V Kohli');
        if (data.bowlers.length > 0) setSelectedBowler('JJ Bumrah');
      })
      .catch(err => setError('Failed to load player list'))
      .finally(() => setInitialLoading(false));
  }, []);

  const handleAnalyse = () => {
    if (!selectedBatter || !selectedBowler) return;
    setLoading(true);
    setError(null);
    getMatchup(selectedBatter, selectedBowler)
      .then(data => {
        if (data.error) {
          setError(data.error);
          setMatchupData(null);
        } else {
          setMatchupData(data);
        }
      })
      .catch(err => setError('Failed to fetch matchup data'))
      .finally(() => setLoading(false));
  };

  if (initialLoading) return <div className="page container"><LoadingScreen message="Loading player data..." /></div>;

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 24 }}>⚔️ Matchup Explorer</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
          Detailed head-to-head analysis from 17 seasons of IPL data (2008–2026)
        </p>

        <div className="card-glass" style={{ marginBottom: 32 }}>
          <div className="matchup-selector">
            <div className="form-group">
              <label className="form-label">Search Batter</label>
              <input 
                list="batter-list"
                className="input" 
                placeholder="Type batter name..."
                value={selectedBatter} 
                onChange={(e) => setSelectedBatter(e.target.value)}
              />
              <datalist id="batter-list">
                {players.batters.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>

            <div className="matchup-vs">VS</div>

            <div className="form-group">
              <label className="form-label">Search Bowler</label>
              <input 
                list="bowler-list"
                className="input" 
                placeholder="Type bowler name..."
                value={selectedBowler} 
                onChange={(e) => setSelectedBowler(e.target.value)}
              />
              <datalist id="bowler-list">
                {players.bowlers.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
          </div>

          <button 
            className="btn btn-primary btn-full" 
            style={{ marginTop: 24 }}
            onClick={handleAnalyse}
            disabled={loading}
          >
            {loading ? 'Analysing...' : '🔍 Analyse Matchup'}
          </button>
        </div>

        {error && (
          <div className="card" style={{ borderColor: 'var(--danger)', textAlign: 'center', padding: 24 }}>
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        {matchupData && !loading && (
          <div className="matchup-container">
            <div className={`verdict-banner verdict-${matchupData.verdictCode}`}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{matchupData.verdict}</h2>
              <p style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
                Based on {matchupData.summary.balls} balls in IPL history
              </p>
            </div>

            <div className="summary-grid">
              <StatCard label="Balls" value={matchupData.summary.balls} />
              <StatCard label="Runs" value={matchupData.summary.runs} />
              <StatCard label="Wickets" value={matchupData.summary.dismissals} color="var(--danger)" />
              <StatCard label="Strike Rate" value={matchupData.summary.strike_rate} />
              <StatCard label="Economy" value={matchupData.summary.economy} />
              <StatCard label="Dot %" value={matchupData.summary.dot_pct} />
            </div>

            <div className="card">
              <h3 className="section-title">Ball-by-Ball History</h3>
              <div className="timeline">
                {Object.entries(groupHistoryByMatch(matchupData.history)).map(([matchId, data]) => (
                  <div key={matchId} className="timeline-match">
                    <div className="timeline-header">
                      <span style={{ fontWeight: 700, fontSize: 14 }}>IPL {data.season}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Match #{matchId}</span>
                    </div>
                    <div className="ball-grid">
                      {data.balls.map((ball, idx) => (
                        <div 
                          key={idx} 
                          className={`ball-circle ${getBallClass(ball)}`}
                          title={`Over ${ball.over}.${ball.ball} - ${ball.runs} runs${ball.isWicket ? ` (${ball.wicketKind})` : ''}`}
                        >
                          {ball.isWicket ? 'W' : ball.runs}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>{value}</div>
    </div>
  );
}

function groupHistoryByMatch(history) {
  const groups = {};
  history.forEach(ball => {
    if (!groups[ball.matchId]) {
      groups[ball.matchId] = {
        season: ball.season,
        balls: []
      };
    }
    groups[ball.matchId].balls.push(ball);
  });
  return groups;
}

function getBallClass(ball) {
  if (ball.isWicket) return 'ball-wicket';
  if (ball.runs === 6) return 'ball-6';
  if (ball.runs === 4) return 'ball-4';
  if (ball.runs === 0) return 'ball-dot';
  if (ball.runs > 0) return `ball-${ball.runs}`;
  return '';
}
