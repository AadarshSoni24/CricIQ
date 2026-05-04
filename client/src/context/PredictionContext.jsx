import { createContext, useContext, useState } from 'react';

const PredictionContext = createContext();

export function PredictionProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const addToHistory = (result) => {
    setLastResult(result);
    setHistory(prev => [result, ...prev].slice(0, 20));
  };

  return (
    <PredictionContext.Provider value={{ history, lastResult, addToHistory }}>
      {children}
    </PredictionContext.Provider>
  );
}

export const usePredictionContext = () => useContext(PredictionContext);
