import { createContext, useContext, useState } from 'react';

const AuctionContext = createContext();

export function AuctionProvider({ children }) {
  const [squad, setSquad] = useState([]);
  const [budget, setBudget] = useState(12000); // 120 Cr in lakhs

  const addPlayer = (player) => {
    setSquad(prev => [...prev, player]);
    setBudget(prev => prev - (player.bidRange?.recommendedLakh || 0));
  };

  const removePlayer = (name) => {
    const p = squad.find(s => s.player === name);
    setSquad(prev => prev.filter(s => s.player !== name));
    if (p) setBudget(prev => prev + (p.bidRange?.recommendedLakh || 0));
  };

  return (
    <AuctionContext.Provider value={{ squad, budget, addPlayer, removePlayer }}>
      {children}
    </AuctionContext.Provider>
  );
}

export const useAuctionContext = () => useContext(AuctionContext);
