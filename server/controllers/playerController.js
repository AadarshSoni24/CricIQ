/**
 * CricIQ — Player Controller
 * Proxies player scout requests to FastAPI.
 */
const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.searchPlayers = async (req, res, next) => {
  try {
    const { q, role, min_score } = req.query;
    const mlRes = await axios.get(`${ML_URL}/ml/scout/search`, {
      params: { q: q || '', role: role || '', min_score: min_score || 0 },
    });
    res.json(mlRes.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};

exports.getPlayer = async (req, res, next) => {
  try {
    const { name } = req.params;
    const mlRes = await axios.post(`${ML_URL}/ml/scout`, {
      player: decodeURIComponent(name),
    });
    res.json(mlRes.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Player not found' });
    }
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};

exports.getPlayerVenues = async (req, res, next) => {
  try {
    // Venue data comes from the scout endpoint
    const { name } = req.params;
    const mlRes = await axios.post(`${ML_URL}/ml/scout`, {
      player: decodeURIComponent(name),
    });
    const data = mlRes.data;
    res.json(data.venues || []);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};

exports.getPlayerMatchups = async (req, res, next) => {
  try {
    const { name } = req.params;
    const mlRes = await axios.post(`${ML_URL}/ml/scout`, {
      player: decodeURIComponent(name),
    });
    const data = mlRes.data;
    res.json(data.matchups || {});
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};

exports.getPlayerList = async (req, res, next) => {
  try {
    const mlRes = await axios.get(`${ML_URL}/ml/scout/players`);
    res.json(mlRes.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    next(err);
  }
};
