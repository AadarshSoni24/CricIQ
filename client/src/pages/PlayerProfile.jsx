import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPlayer } from '../services/api';
import ScoutingScore from '../components/scout/ScoutingScore';
import BatterProfile from '../components/scout/BatterProfile';
import BowlerProfile from '../components/scout/BowlerProfile';
import LoadingScreen from '../components/common/LoadingScreen';

export default function PlayerProfile() {
  const { name } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    setLoading(true);
    getPlayer(decodeURIComponent(name))
      .then(data => setPlayer(data))
      .catch(() => setPlayer(null))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return <div className="page container"><LoadingScreen message={`Loading ${decodeURIComponent(name)}...`} /></div>;
  if (!player) return (
    <div className="page container" style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <h2>Player not found</h2>
      <p style={{ color: 'var(--text-muted)' }}>Could not find data for "{decodeURIComponent(name)}"</p>
    </div>
  );

  const isBatter = player.role === 'batter' || player.role === 'allrounder';
  const isBowler = player.role === 'bowler' || player.role === 'allrounder';

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>{player.player}</h1>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span className="badge" style={{ background: 'var(--accent-blue)', color: 'white' }}>{player.role}</span>
              {player.archetype && (
                <span className="badge" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)' }}>
                  {player.archetype}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {player.seasonTrend === 'improving' ? '📈 Improving form' : player.seasonTrend === 'declining' ? '📉 Declining form' : '➡️ Stable form'}
            </p>
          </div>
          <ScoutingScore score={player.scoutingScore} archetype={player.archetype} trend={player.seasonTrend} />
        </div>

        {/* Tabs */}
        {player.role === 'allrounder' && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', borderRadius: 12, padding: 4, border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
            <button className={`btn ${tab === 'overview' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '8px 20px', fontSize: 13 }} onClick={() => setTab('overview')}>🏏 Batting</button>
            <button className={`btn ${tab === 'bowling' ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '8px 20px', fontSize: 13 }} onClick={() => setTab('bowling')}>🎳 Bowling</button>
          </div>
        )}

        {/* Profile content */}
        {(isBatter && (tab === 'overview' || player.role !== 'allrounder')) && (
          <BatterProfile profile={player.profile} phases={player.phases} />
        )}
        {(isBowler && (tab === 'bowling' || player.role === 'bowler')) && (
          <BowlerProfile profile={player.profile?.bowling || player.profile} phases={player.phases} />
        )}
      </div>
    </div>
  );
}
