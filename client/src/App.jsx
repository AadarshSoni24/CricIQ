import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PredictionProvider } from './context/PredictionContext';
import { AuctionProvider } from './context/AuctionContext';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Predictor from './pages/Predictor';
import Scout from './pages/Scout';
import Auction from './pages/Auction';
import PlayerProfile from './pages/PlayerProfile';
import MatchupExplorer from './pages/MatchupExplorer';

export default function App() {
  return (
    <BrowserRouter>
      <PredictionProvider>
        <AuctionProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict" element={<Predictor />} />
            <Route path="/scout" element={<Scout />} />
            <Route path="/scout/:name" element={<PlayerProfile />} />
            <Route path="/auction" element={<Auction />} />
            <Route path="/player/:name" element={<PlayerProfile />} />
            <Route path="/matchup" element={<MatchupExplorer />} />
          </Routes>
        </AuctionProvider>
      </PredictionProvider>
    </BrowserRouter>
  );
}
