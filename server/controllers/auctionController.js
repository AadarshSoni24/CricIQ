/**
 * CricIQ — Auction Controller
 */
const axios = require('axios');
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.recommend = async (req, res, next) => {
  try {
    const { player, role, basePriceLakh } = req.body;
    const mlRes = await axios.post(`${ML_URL}/ml/auction/price`, {
      player, role, basePriceLakh: basePriceLakh || 200,
    });
    res.json(mlRes.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};

exports.getFilters = async (req, res) => {
  res.json({
    roles: ['batter', 'bowler', 'allrounder', 'wk'],
    archetypes: {
      batter: ['Finisher', 'Aggressor', 'Anchor', 'All-Phase', 'Accumulator', 'Utility'],
      bowler: ['Death Specialist', 'Powerplay Specialist', 'Strike Bowler', 'Defensive', 'All-Phase', 'Utility'],
    },
    tiers: ['Premium', 'High Value', 'Mid Tier', 'Budget'],
    priceRanges: [
      { label: 'Under ₹50L', min: 0, max: 50 },
      { label: '₹50L – ₹2Cr', min: 50, max: 200 },
      { label: '₹2Cr – ₹5Cr', min: 200, max: 500 },
      { label: '₹5Cr – ₹10Cr', min: 500, max: 1000 },
      { label: 'Above ₹10Cr', min: 1000, max: 99999 },
    ],
  });
};
