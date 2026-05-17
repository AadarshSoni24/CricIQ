/**
 * CricIQ — Express API Server
 * ============================
 * Main entry point. Connects MongoDB, mounts routes, proxies ML calls to FastAPI.
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/errorHandler');

const predictRoutes = require('./routes/predict');
const playerRoutes = require('./routes/players');
const auctionRoutes = require('./routes/auction');
const searchRoutes = require('./routes/search');
const matchupRoutes = require('./routes/matchup');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'] }));
app.use(express.json());
app.use(morgan('dev'));

// ── MongoDB Connection ────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/criciq';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.warn('⚠️ MongoDB not available — running without database');
    console.warn('   Predictions & search history won\'t be persisted');
  });

// ── Routes ────────────────────────────────────────────────
app.use('/api/predict', predictRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/matchup', matchupRoutes);

// ── Static data endpoints ─────────────────────────────────
const TEAMS = [
  { id: 'mi', name: 'Mumbai Indians', short: 'MI', city: 'Mumbai', primary: '#004BA0', secondary: '#D1AB3E' },
  { id: 'csk', name: 'Chennai Super Kings', short: 'CSK', city: 'Chennai', primary: '#F9CD05', secondary: '#FF6B00' },
  { id: 'rcb', name: 'Royal Challengers Bengaluru', short: 'RCB', city: 'Bengaluru', primary: '#EC1C24', secondary: '#B8860B' },
  { id: 'kkr', name: 'Kolkata Knight Riders', short: 'KKR', city: 'Kolkata', primary: '#3A225D', secondary: '#B8860B' },
  { id: 'srh', name: 'Sunrisers Hyderabad', short: 'SRH', city: 'Hyderabad', primary: '#F7A721', secondary: '#E03A3E' },
  { id: 'dc', name: 'Delhi Capitals', short: 'DC', city: 'Delhi', primary: '#0078BC', secondary: '#EF1B23' },
  { id: 'rr', name: 'Rajasthan Royals', short: 'RR', city: 'Jaipur', primary: '#EA1A85', secondary: '#254AA5' },
  { id: 'pbks', name: 'Punjab Kings', short: 'PBKS', city: 'Mohali', primary: '#ED1B24', secondary: '#A7A9AC' },
  { id: 'gt', name: 'Gujarat Titans', short: 'GT', city: 'Ahmedabad', primary: '#1C1C5E', secondary: '#B8860B' },
  { id: 'lsg', name: 'Lucknow Super Giants', short: 'LSG', city: 'Lucknow', primary: '#A72056', secondary: '#FFCC00' },
];

const fs = require('fs');
const path = require('path');

app.get('/api/teams', (req, res) => res.json(TEAMS));

app.get('/api/venues', (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../venue_features.csv');
    const data = fs.readFileSync(csvPath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    // Skip header
    const venues = lines.slice(1).map(line => {
      // Handle commas inside quotes for venue names like "Barsapara Cricket Stadium, Guwahati"
      const match = line.match(/(?:"([^"]+)"|([^,]+))(?:,|$)/g);
      if (!match) return null;
      
      const parts = match.map(p => p.replace(/,$/, '').replace(/(^"|"$)/g, '').trim());
      if (parts.length < 6) return null;
      
      const name = parts[0];
      const city = name.includes(',') ? name.split(',').pop().trim() : name;
      
      return {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: name,
        city: city,
        avgScore: parseInt(parseFloat(parts[2])),
        batFirstWin: parseInt(parseFloat(parts[3]) * 100),
        pitch: parts[5].replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
      };
    }).filter(Boolean);
    
    res.json(venues);
  } catch (err) {
    console.error("Error reading venues:", err);
    res.status(500).json({ error: "Failed to load venues" });
  }
});

// ── Health ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CricIQ API', mongo: mongoose.connection.readyState === 1 });
});

// ── Error handler ─────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🏏 CricIQ API running on http://localhost:${PORT}`);
  console.log(`   ML Service expected at ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
});
