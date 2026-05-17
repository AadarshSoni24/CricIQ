import { useState, useCallback } from 'react';
import { getAuctionRecommendation, getAuctionFilters } from '../services/api';

export function useAuction() {
  const [recommendation, setRecommendation] = useState(null);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadFilters = useCallback(async () => {
    try {
      const data = await getAuctionFilters();
      setFilters(data);
    } catch { /* silent */ }
  }, []);

  const recommend = useCallback(async (player, role, basePriceLakh) => {
    setLoading(true);
    try {
      const data = await getAuctionRecommendation({ player, role, basePriceLakh });
      setRecommendation(data);
      return data;
    } catch { setRecommendation(null); return null; }
    finally { setLoading(false); }
  }, []);

  return { recommendation, filters, loading, loadFilters, recommend };
}
