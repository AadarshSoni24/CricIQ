import PlayerSearch from '../components/search/PlayerSearch';

export default function Scout() {
  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>👤 Player Scout</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          Franchise-grade scouting profiles · 40+ advanced metrics · T20 archetypes
        </p>
        <PlayerSearch />
      </div>
    </div>
  );
}
