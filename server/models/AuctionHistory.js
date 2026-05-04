const mongoose = require('mongoose');

const auctionHistorySchema = new mongoose.Schema({
  player: { type: String, required: true, index: true },
  year: Number,
  team: String,
  basePriceLakh: Number,
  soldPriceLakh: Number,
  role: String,
  isOverseas: { type: Boolean, default: false },
  season: String,
});

module.exports = mongoose.model('AuctionHistory', auctionHistorySchema);
