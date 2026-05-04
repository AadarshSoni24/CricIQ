const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  venue: { type: String, required: true },
  tossWinner: String,
  tossDecision: String,
  predictedWinner: String,
  team1WinProb: Number,
  team2WinProb: Number,
  confidence: Number,
  shapFactors: [{
    factor: String,
    impact: Number,
    plainText: String,
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Prediction', predictionSchema);
