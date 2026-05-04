import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import { useEffect } from 'react';
import './SearchBar.css';

export default function SearchBar({ placeholder = 'Search players...', onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 300);
  const { results, loading, search } = usePlayerSearch();
  const navigate = useNavigate();

  useEffect(() => {
    if (debounced.length >= 2) {
      search(debounced);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [debounced, search]);

  const handleSelect = (player) => {
    setQuery('');
    setOpen(false);
    if (onSelect) onSelect(player);
    else navigate(`/player/${encodeURIComponent(player.name)}`);
  };

  return (
    <div className="search-bar-wrapper">
      <div className="search-input-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {loading && <span className="search-spinner">⏳</span>}
      </div>

      {open && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((p, i) => (
            <button key={i} className="search-result" onClick={() => handleSelect(p)}>
              <div className="search-result-info">
                <span className="search-result-name">{p.name}</span>
                <span className="search-result-role">{p.role}</span>
              </div>
              <div className="search-result-meta">
                <span className="badge badge-sm" style={{
                  background: `${p.scoutingScore >= 70 ? '#00C851' : '#FF6B00'}22`,
                  color: p.scoutingScore >= 70 ? '#00C851' : '#FF6B00',
                }}>{p.scoutingScore}</span>
                <span className="search-result-arch">{p.archetype}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
