/**
 * CricIQ — Predict Controller
 * Proxies prediction requests to FastAPI ML service and saves to MongoDB.
 */
const axios = require('axios');
const Prediction = require('../models/Prediction');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.predict = async (req, res, next) => {
  try {
    const { team1, team2, venue, tossWinner, tossDecision } = req.body;

    if (!team1 || !team2 || !venue) {
      return res.status(400).json({ error: 'team1, team2, and venue are required' });
    }

    const normalizedDecision = (tossDecision && tossDecision.toLowerCase() === 'bowl') ? 'field' : 'bat';

    // Call FastAPI ML service
    const mlResponse = await axios.post(`${ML_URL}/ml/predict`, {
      team1,
      team2,
      venue,
      toss_winner: tossWinner || team1,
      toss_decision: normalizedDecision,
    });

    const result = mlResponse.data;

    // Save to MongoDB (non-blocking)
    Prediction.create({
      team1: result.team1,
      team2: result.team2,
      venue: result.venue,
      tossWinner: tossWinner,
      tossDecision: tossDecision,
      predictedWinner: result.predictedWinner,
      team1WinProb: result.team1WinProb,
      team2WinProb: result.team2WinProb,
      confidence: result.confidence,
      shapFactors: result.shapFactors,
    }).catch(dbErr => {
      console.warn('Could not save prediction to DB:', dbErr.message);
    });

    res.json(result);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json({
        error: 'ML service error',
        detail: err.response.data,
      });
    }
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(predictions);
  } catch (err) {
    // If MongoDB not connected, return empty
    res.json([]);
  }
};

exports.savePrediction = async (req, res, next) => {
  try {
    const prediction = await Prediction.create(req.body);
    res.status(201).json(prediction);
  } catch (err) {
    next(err);
  }
};
