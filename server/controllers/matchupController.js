/**
 * CricIQ — Matchup Controller
 * Proxies matchup analysis requests to FastAPI.
 */
const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.getMatchupData = async (req, res, next) => {
  try {
    const { batter, bowler } = req.body;
    
    if (!batter || !bowler) {
      return res.status(400).json({ error: 'Both batter and bowler names are required' });
    }

    const mlRes = await axios.post(`${ML_URL}/ml/matchup`, {
      batter,
      bowler,
    });
    
    res.json(mlRes.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    console.error('Matchup Controller Error:', err.message);
    next(err);
  }
};
