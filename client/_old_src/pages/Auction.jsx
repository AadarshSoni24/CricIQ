import { useState, useEffect } from 'react';
import { useAuction } from '../hooks/useAuction';
import { useAuctionContext } from '../context/AuctionContext';
import SearchBar from '../components/common/SearchBar';
import AuctionFilters from '../components/auction/AuctionFilters';
import PlayerBidCard from '../components/auction/PlayerBidCard';
import BidRecommendation from '../components/auction/BidRecommendation';
import SquadBuilder from '../components/auction/SquadBuilder';
import LoadingScreen from '../components/common/LoadingScreen';

export default function Auction() {
  const { recommendation, filters, loading, loadFilters, recommend } = useAuction();
  const { addPlayer } = useAuctionContext();

  useEffect(() => { loadFilters(); }, [loadFilters]);

  const handlePlayerSelect = (player) => {
    recommend(player.name, player.role);
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>💰 Auction Intelligence</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          AI-driven bid recommendations · Squad builder · Archetype-based valuation
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <SearchBar placeholder="Search a player for bid recommendation..." onSelect={handlePlayerSelect} />
            </div>

            <AuctionFilters filters={filters} onFilter={() => {}} />

            {loading && <LoadingScreen message="Calculating bid range..." />}

            {recommendation && !loading && (
              <>
                <PlayerBidCard data={recommendation} onAdd={addPlayer} />
                <BidRecommendation data={recommendation} />
              </>
            )}

            {!recommendation && !loading && (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                  Search for any player to get an AI-powered bid recommendation
                </p>
              </div>
            )}
          </div>

          <SquadBuilder />
        </div>
      </div>
    </div>
  );
}
