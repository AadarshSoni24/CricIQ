/**
 * CricIQ — Search Controller
 */
const axios = require('axios');
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.search = async (req, res, next) => {
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
