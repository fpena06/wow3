const mongoose = require("mongoose");
const WatchlistSchema = mongoose.Schema({
  Company_id: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  User_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = { Watchlist: WatchlistSchema };
