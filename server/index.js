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
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
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
  { name: 'Chennai Super Kings', short: 'CSK', color: '#F9CD05' },
  { name: 'Delhi Capitals', short: 'DC', color: '#0078BC' },
  { name: 'Gujarat Titans', short: 'GT', color: '#1C1C5E' },
  { name: 'Kolkata Knight Riders', short: 'KKR', color: '#3A225D' },
  { name: 'Lucknow Super Giants', short: 'LSG', color: '#A72056' },
  { name: 'Mumbai Indians', short: 'MI', color: '#004BA0' },
  { name: 'Punjab Kings', short: 'PBKS', color: '#ED1B24' },
  { name: 'Rajasthan Royals', short: 'RR', color: '#EA1A85' },
  { name: 'Royal Challengers Bengaluru', short: 'RCB', color: '#EC1C24' },
  { name: 'Sunrisers Hyderabad', short: 'SRH', color: '#F7A721' },
];

const VENUES = [
  'Wankhede Stadium', 'MA Chidambaram Stadium', 'Eden Gardens',
  'M Chinnaswamy Stadium', 'Arun Jaitley Stadium',
  'Rajiv Gandhi International Stadium',
  'Punjab Cricket Association IS Bindra Stadium',
  'Sawai Mansingh Stadium', 'Narendra Modi Stadium, Ahmedabad',
  'Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow',
  'Maharashtra Cricket Association Stadium',
  'Himachal Pradesh Cricket Association Stadium',
];

app.get('/api/teams', (req, res) => res.json(TEAMS));
app.get('/api/venues', (req, res) => res.json(VENUES));

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
