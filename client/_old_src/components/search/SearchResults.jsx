import PlayerCard from '../scout/PlayerCard';

export default function SearchResults({ results = [], loading }) {
  if (loading) return <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</p>;
  if (!results.length) return null;
  return (
    <div className="grid-3">
      {results.map((p, i) => <PlayerCard key={i} player={p} />)}
    </div>
  );
}
