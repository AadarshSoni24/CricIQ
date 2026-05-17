const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  uuid: { type: String, unique: true, sparse: true, index: true },
  aliases: [String],
  role: { type: String, enum: ['batter', 'bowler', 'allrounder', 'wk'], default: 'batter' },
  battingStyle: String,
  bowlingStyle: String,
  country: String,
  isCapped: { type: Boolean, default: true },
  isOverseas: { type: Boolean, default: false },
  stats: {
    batting: {
      runs: Number, avg: Number, sr: Number, innings: Number,
      fours: Number, sixes: Number, boundaryPct: Number, dotPct: Number,
    },
    bowling: {
      wickets: Number, economy: Number, sr: Number,
      dotPct: Number, balls: Number,
    },
    phases: {
      powerplay: { type: mongoose.Schema.Types.Mixed },
      middle: { type: mongoose.Schema.Types.Mixed },
      death: { type: mongoose.Schema.Types.Mixed },
    },
    venues: [{ venue: String, runs: Number, sr: Number, avg: Number }],
    scoutingScore: Number,
    archetype: String,
  },
  auctionHistory: [{
    year: Number, team: String,
    basePriceLakh: Number, soldPriceLakh: Number,
  }],
  lastUpdated: { type: Date, default: Date.now },
});

playerSchema.index({ name: 'text' });
module.exports = mongoose.model('Player', playerSchema);
