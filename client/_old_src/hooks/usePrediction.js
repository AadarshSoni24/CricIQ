import { useState, useCallback } from 'react';
import { predictMatch } from '../services/api';

export function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const predict = useCallback(async (matchData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictMatch(matchData);
      setResult(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Prediction failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, predict, reset };
}
