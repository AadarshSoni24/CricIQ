import { useState, useCallback } from 'react';
import { searchPlayers, getPlayer } from '../services/api';

export function usePlayerSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState(null);

  const search = useCallback(async (query, role = '') => {
    if (!query || query.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await searchPlayers(query, role);
      setResults(data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const fetchPlayer = useCallback(async (name) => {
    setLoading(true);
    try {
      const data = await getPlayer(name);
      setPlayer(data);
      return data;
    } catch { setPlayer(null); return null; }
    finally { setLoading(false); }
  }, []);

  return { results, loading, player, search, fetchPlayer, setResults };
}
