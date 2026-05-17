import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { globalSearch } from '../../services/api';
import PlayerCard from '../scout/PlayerCard';

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 350);

  useEffect(() => {
    if (debounced.length < 2) { setResults([]); return; }
    setLoading(true);
    globalSearch(debounced, role).then(data => {
      setResults(data.results || []);
    }).catch(() => setResults([]))
    .finally(() => setLoading(false));
  }, [debounced, role]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input type="text" className="input" placeholder="Search players..."
          value={query} onChange={e => setQuery(e.target.value)}
          style={{ flex: 1 }} />
        <select className="select" value={role} onChange={e => setRole(e.target.value)}
          style={{ width: 160 }}>
          <option value="">All Roles</option>
          <option value="batter">Batter</option>
          <option value="bowler">Bowler</option>
        </select>
      </div>
      {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Searching...</p>}
      <div className="grid-3">
        {results.map((p, i) => <PlayerCard key={i} player={p} />)}
      </div>
      {!loading && results.length === 0 && debounced.length >= 2 && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No players found</p>
      )}
    </div>
  );
}
